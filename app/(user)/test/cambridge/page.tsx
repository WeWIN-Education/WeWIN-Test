"use client";

import { ChangeEvent, useRef, useState } from "react";
import {
  CheckCircle2,
  CircleStop,
  Loader2,
  Mic,
  RefreshCw,
  Send,
  UserRound,
  Volume2,
} from "lucide-react";

import {
  CAMBRIDGE_LEVELS,
  CAMBRIDGE_QUESTION_BANK,
  type CambridgeLevel,
} from "@/app/constants/cambridge";
import { getSpeakingUploadFolderId } from "@/app/lib/googleDriveConfig";
import { getIeltsSheetId } from "@/app/lib/googleSheetsConfig";
import { blobToBase64, getSupportedMimeType } from "@/app/utils/audio";

type Stage = "form" | "test" | "done";

interface StudentInfo {
  fullName: string;
  birthDate: string;
  location: string;
  phone: string;
  email: string;
  consultant: string;
  level: CambridgeLevel;
}

const initialStudentInfo: StudentInfo = {
  fullName: "",
  birthDate: "",
  location: "",
  phone: "",
  email: "",
  consultant: "",
  level: "Starters",
};

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function CambridgeTestPage() {
  const [stage, setStage] = useState<Stage>("form");
  const [studentInfo, setStudentInfo] = useState<StudentInfo>(initialStudentInfo);
  const [prompts, setPrompts] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [audioSrc, setAudioSrc] = useState<Record<number, string>>({});
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submittedId, setSubmittedId] = useState("");

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isFormValid = Object.values(studentInfo).every((value) =>
    String(value).trim()
  );
  const canSubmit = prompts.length === 2 && Boolean(audioSrc[0] && audioSrc[1]);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setStudentInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleStart = () => {
    if (!isFormValid) {
      setError("Please complete student information before starting.");
      return;
    }

    setError("");
    setAudioSrc({});
    setCurrentIndex(0);
    setPrompts(shuffle(CAMBRIDGE_QUESTION_BANK[studentInfo.level]).slice(0, 2));
    setStage("test");
  };

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const stopTracks = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const startRecording = async () => {
    if (recording || !prompts[currentIndex]) return;

    try {
      setError("");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedMimeType();
      const recorder = new MediaRecorder(stream, { mimeType });

      streamRef.current = stream;
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      const promptIndex = currentIndex;
      recorder.onstop = async () => {
        clearTimer();
        stopTracks();
        setRecording(false);

        const blob = new Blob(chunksRef.current, { type: mimeType });
        if (blob.size === 0) {
          setError("No audio was detected. Please record again.");
          return;
        }

        const base64 = await blobToBase64(blob);
        setAudioSrc((prev) => ({ ...prev, [promptIndex]: base64 }));

        if (promptIndex === 0) {
          setTimeout(() => setCurrentIndex(1), 350);
        }
      };

      recorder.start();
      setElapsed(0);
      setRecording(true);
      intervalRef.current = setInterval(() => {
        setElapsed((value) => value + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone error:", err);
      setError("Cannot access microphone. Please allow microphone permission.");
      clearTimer();
      stopTracks();
      setRecording(false);
    }
  };

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
  };

  const resetTest = () => {
    if (recording) stopRecording();
    clearTimer();
    stopTracks();
    setPrompts([]);
    setAudioSrc({});
    setCurrentIndex(0);
    setElapsed(0);
    setError("");
    setStage("form");
  };

  const submitTest = async () => {
    if (!canSubmit || submitting) return;

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/submit-cambridge-speaking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sheetId: getIeltsSheetId(),
          data: {
            ...studentInfo,
            prompts,
            audioBase64: {
              1: audioSrc[0],
              2: audioSrc[1],
            },
            driveFolderId: getSpeakingUploadFolderId(),
          },
        }),
      });

      const text = await response.text();
      const json = JSON.parse(text || "{}");

      if (!response.ok || !json?.success) {
        throw new Error(json?.error || "Cambridge submission failed.");
      }

      setSubmittedId(json.id || "");
      setStage("done");
    } catch (err: unknown) {
      console.error("Cambridge submit error:", err);
      setError(getErrorMessage(err, "Cannot submit Cambridge speaking test."));
    } finally {
      setSubmitting(false);
    }
  };

  if (stage === "done") {
    return (
      <main className="min-h-[calc(80vh-60px)] bg-[#F3F8FC] px-4 py-10">
        <section className="mx-auto max-w-3xl rounded-lg border border-blue-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-3xl font-extrabold text-[#0E4BA9]">
            Cambridge Speaking submitted
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
            The office will see this result in Cambridge Results after Apps
            Script finishes saving audio, transcribing, and scoring.
          </p>
          {submittedId && (
            <p className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
              Submission ID: {submittedId}
            </p>
          )}
          <button
            type="button"
            onClick={resetTest}
            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#0E4BA9] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0A3F91]"
          >
            <RefreshCw className="h-4 w-4" />
            Start another test
          </button>
        </section>
      </main>
    );
  }

  if (stage === "test") {
    const currentPrompt = prompts[currentIndex] || "";

    return (
      <main className="min-h-[calc(80vh-60px)] bg-[#F3F8FC] px-4 py-8">
        <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[1fr_340px]">
          <section className="rounded-lg border border-blue-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="text-sm font-semibold uppercase tracking-wide text-[#8A5A1E]">
                  Cambridge Speaking
                </div>
                <h1 className="mt-2 text-3xl font-extrabold text-[#0E4BA9]">
                  {studentInfo.level} prompt {currentIndex + 1} of 2
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  Record the sentence clearly. When prompt 1 is saved, prompt 2
                  opens automatically.
                </p>
              </div>
              <button
                type="button"
                onClick={resetTest}
                disabled={recording || submitting}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:border-[#0E4BA9] hover:text-[#0E4BA9] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw className="h-4 w-4" />
                Reset
              </button>
            </div>

            <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-5">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Please read
              </div>
              <p className="mt-3 text-2xl font-extrabold leading-9 text-slate-950">
                {currentPrompt}
              </p>
            </div>

            <div className="mt-8 flex flex-col items-center gap-4">
              <button
                type="button"
                onClick={recording ? stopRecording : startRecording}
                disabled={submitting}
                className={`flex h-20 w-20 items-center justify-center rounded-full text-white shadow-lg transition ${
                  recording
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-[#0E4BA9] hover:bg-[#0A3F91]"
                } disabled:cursor-not-allowed disabled:opacity-60`}
                aria-label={recording ? "Stop recording" : "Start recording"}
              >
                {recording ? (
                  <CircleStop className="h-9 w-9" />
                ) : (
                  <Mic className="h-9 w-9" />
                )}
              </button>
              <div className="text-center">
                <div className="text-lg font-bold text-slate-800">
                  {recording ? formatTime(elapsed) : "Ready"}
                </div>
                <p className="text-sm text-slate-500">
                  {recording ? "Recording now" : "Click the microphone to record"}
                </p>
              </div>
            </div>

            {error && (
              <div className="mt-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            <div className="mt-8 flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-600">
                {canSubmit
                  ? "Both recordings are ready."
                  : "Complete both recordings before submitting."}
              </div>
              <button
                type="button"
                onClick={submitTest}
                disabled={!canSubmit || submitting || recording}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#0E4BA9] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0A3F91] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Submit Cambridge test
              </button>
            </div>
          </section>

          <aside className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E8F2FF] text-[#0E4BA9]">
                <UserRound className="h-5 w-5" />
              </div>
              <div>
                <div className="font-bold text-slate-900">
                  {studentInfo.fullName}
                </div>
                <div className="text-sm text-slate-500">{studentInfo.email}</div>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {prompts.map((prompt, index) => (
                <div
                  key={prompt}
                  className={`rounded-lg border p-4 ${
                    currentIndex === index
                      ? "border-[#0E4BA9] bg-blue-50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-bold text-slate-900">
                      Prompt {index + 1}
                    </div>
                    {audioSrc[index] ? (
                      <span className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">
                        Saved
                      </span>
                    ) : (
                      <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500">
                        Pending
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm leading-5 text-slate-600">
                    {prompt}
                  </p>
                  {audioSrc[index] && (
                    <div className="mt-3">
                      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <Volume2 className="h-3.5 w-3.5" />
                        Playback
                      </div>
                      <audio controls src={audioSrc[index]} className="w-full" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </aside>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(80vh-60px)] bg-[#F3F8FC] px-4 py-10">
      <section className="mx-auto max-w-4xl rounded-lg border border-blue-100 bg-white p-6 shadow-sm sm:p-8">
        <div>
          <div className="text-sm font-semibold uppercase tracking-wide text-[#8A5A1E]">
            WeWIN Cambridge Speaking
          </div>
          <h1 className="mt-2 text-3xl font-extrabold text-[#0E4BA9]">
            Cambridge Speaking Test
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Enter the student information, choose a level, then record two
            prompts. The result will be saved to Speaking_Cambridge.
          </p>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <TextField
            label="Full name"
            name="fullName"
            value={studentInfo.fullName}
            onChange={handleChange}
            required
          />
          <TextField
            label="Birth date"
            name="birthDate"
            value={studentInfo.birthDate}
            type="date"
            onChange={handleChange}
            required
          />
          <TextField
            label="Location"
            name="location"
            value={studentInfo.location}
            onChange={handleChange}
            required
          />
          <TextField
            label="Phone"
            name="phone"
            value={studentInfo.phone}
            onChange={handleChange}
            required
          />
          <TextField
            label="Email"
            name="email"
            type="email"
            value={studentInfo.email}
            onChange={handleChange}
            required
          />
          <TextField
            label="Consultant"
            name="consultant"
            value={studentInfo.consultant}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mt-7">
          <label className="block text-sm font-semibold text-[#0E4BA9]">
            Level <span className="text-rose-500">*</span>
          </label>
          <div className="mt-3 grid gap-3 sm:grid-cols-4">
            {CAMBRIDGE_LEVELS.map((level) => (
              <label
                key={level}
                className={`flex cursor-pointer items-center justify-center rounded-lg border px-4 py-3 text-sm font-bold transition ${
                  studentInfo.level === level
                    ? "border-[#0E4BA9] bg-[#E8F2FF] text-[#0E4BA9]"
                    : "border-slate-200 bg-white text-slate-700 hover:border-[#0E4BA9]"
                }`}
              >
                <input
                  type="radio"
                  name="level"
                  value={level}
                  checked={studentInfo.level === level}
                  onChange={handleChange}
                  className="sr-only"
                />
                {level}
              </label>
            ))}
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={handleStart}
            disabled={!isFormValid}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#0E4BA9] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0A3F91] disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            <Mic className="h-4 w-4" />
            Start speaking test
          </button>
        </div>
      </section>
    </main>
  );
}

function TextField({
  label,
  name,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-[#0E4BA9]">
        {label} {required && <span className="text-rose-500">*</span>}
      </span>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#0E4BA9] focus:ring-2 focus:ring-[#0E4BA9]/15"
      />
    </label>
  );
}
