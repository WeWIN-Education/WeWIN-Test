"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { apiCall } from "@/app/utils/apiClient";
import { useNotification } from "@/app/utils/useNotification";
import Notification from "@/app/components/notification";
import ConfirmPopup from "@/app/components/confirmPopup";
import localforage from "localforage";
import { getSupportedMimeType } from "@/app/utils/audio";
import { getFallbackSpeakingQuestions } from "@/app/constants/speaking";
import {
  bindAudioToCurrentSession,
  isAudioSessionValid,
} from "@/app/utils/ieltsStorage";
import { getIeltsSheetId } from "@/app/lib/googleSheetsConfig";
import { getSpeakingUploadFolderId } from "@/app/lib/googleDriveConfig";


interface IELTSQuestionSet {
  part1: string[];
  part2: { topic: string; bullets: string[]; followUp: string };
  part3: { reading: string; questions: string[] };
}

interface IeltsLogData {
  name?: string;
  email?: string;
  part1?: string;
  link1?: string;
  part2?: string;
  link2?: string;
  part3?: string;
  link3?: string;
  linkPdf?: string;
}

interface UserInfo {
  fullName?: string;
  birthDate?: string;
  location?: string;
  phone?: string;
  email?: string;
  consultant?: string;
  ieltsNeed?: string;
  ieltsOther?: string;
  selfScore?: string;
  studyTime?: string;
}

/** Convert Blob → base64 data URL (để lưu localStorage & phát lại không cần network) */
const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });

async function loadSpeakingAudioBase64(): Promise<Record<number, string>> {
  const stored = JSON.parse(localStorage.getItem("ielts_audio_base64") || "{}");
  const audioBase64: Record<number, string> = { ...stored };

  for (const part of [1, 2, 3]) {
    if (audioBase64[part]) continue;

    const blob = await localforage.getItem<Blob>(`ielts_speaking_blob_${part}`);
    if (blob instanceof Blob && blob.size > 0) {
      audioBase64[part] = await blobToBase64(blob);
    }
  }

  localStorage.setItem("ielts_audio_base64", JSON.stringify(audioBase64));
  return audioBase64;
}

export default function SpeakingSection({
  userInfo,
  onFinish,
}: {
  userInfo?: UserInfo;
  onFinish?: () => void;
}) {
  const { data: session } = useSession();
  const { notify, visible, message, type, close } = useNotification();

  const accessToken = session?.accessToken as string | undefined;

  const [questions, setQuestions] = useState<IELTSQuestionSet | null>(null);
  const [loadingQuestions, setLoadingQuestions] = useState(true);

  const [recordingPart, setRecordingPart] = useState<number | null>(null);
  const [recordedParts, setRecordedParts] = useState<number[]>([]);
  const [timer, setTimer] = useState(0);

  /** audioSrc[1|2|3] = "data:audio/wav;base64,..." */
  const [audioSrc, setAudioSrc] = useState<Record<number, string>>({});
  const [uploading, setUploading] = useState<Record<number, boolean>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const recorderRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const loadedRef = useRef(false);

  const DRIVE_FOLDER_ID = getSpeakingUploadFolderId();
  const SHEET_ID = getIeltsSheetId();
  const APPS_SCRIPT_SUBMIT_ENABLED = Boolean(
    process.env.NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_WEB_APP_URL
  );

  const chunksRef = useRef<BlobPart[]>([]);

  const getStudentInfo = (): UserInfo => {
    try {
      const stored = JSON.parse(
        localStorage.getItem("ielts_userInfo") || "{}"
      ) as UserInfo;

      return {
        ...stored,
        ...userInfo,
      };
    } catch {
      return userInfo || {};
    }
  };

  /* ---------------------- Load trạng thái ban đầu ---------------------- */

  // Đã kết thúc chưa
  useEffect(() => {
    const finished = localStorage.getItem("ielts_finished");
    if (finished === "true") setIsFinished(true);
  }, []);

  // Load câu hỏi (giữ qua reload trong session)
  useEffect(() => {
    if (loadedRef.current) return; // ⛔ Ngăn gọi lần 2
    loadedRef.current = true;

    const loadQuestions = async () => {
      try {
        const savedQuestions = localStorage.getItem("ielts_questions");
        if (savedQuestions) {
          const parsed = JSON.parse(savedQuestions) as IELTSQuestionSet;
          if (parsed?.part1?.length) {
            setQuestions(parsed);
            setLoadingQuestions(false);
            return;
          }
          localStorage.removeItem("ielts_questions");
        }

        const res = await fetch("/api/generate-ielts");
        const data: IELTSQuestionSet = res.ok
          ? await res.json()
          : getFallbackSpeakingQuestions();

        setQuestions(data);
        localStorage.setItem("ielts_questions", JSON.stringify(data));
      } catch (err) {
        console.error("❌ Error loading questions:", err);
        const fallback = getFallbackSpeakingQuestions();
        setQuestions(fallback);
        localStorage.setItem("ielts_questions", JSON.stringify(fallback));
      } finally {
        setLoadingQuestions(false);
      }
    };

    loadQuestions();
  }, []);

  // Load lại audio đã ghi — chỉ khi thuộc phiên thi hiện tại
  useEffect(() => {
    if (!isAudioSessionValid()) {
      localStorage.removeItem("ielts_audio_base64");
      localStorage.removeItem("ielts_audio_links");
      return;
    }

    const saved = localStorage.getItem("ielts_audio_base64");
    if (!saved) return;

    try {
      const data: Record<number, string> = JSON.parse(saved);
      const parts = Object.keys(data)
        .map((p) => Number(p))
        .filter((p) => Boolean(data[p]));

      if (parts.length === 0) return;

      setAudioSrc(data);
      setRecordedParts(parts);
    } catch (err) {
      console.error("❌ Error parsing saved audio:", err);
      localStorage.removeItem("ielts_audio_base64");
    }
  }, []);

  /* --------------------------- Recording logic -------------------------- */

  const clearIntervalTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startRecording = async (part: number) => {
    if (recordedParts.includes(part)) {
      notify("❌ Phần này bạn đã ghi âm rồi!", "error");
      return;
    }

    if (!accessToken) {
      notify(
        "Dang dung tai khoan email/mat khau. He thong se dung quyen Google phia server neu da cau hinh.",
        "info"
      );
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = getSupportedMimeType();
      const recorder = new MediaRecorder(stream, { mimeType });
      recorderRef.current = recorder;

      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });

        if (blob.size === 0) {
          notify("⚠️ Không phát hiện âm thanh!", "error");
          return;
        }

        // Lưu base64 để nghe lại (audio tag)
        const base64 = await blobToBase64(blob);
        setAudioSrc((prev) => {
          const updated = { ...prev, [part]: base64 };
          localStorage.setItem("ielts_audio_base64", JSON.stringify(updated));
          bindAudioToCurrentSession();
          return updated;
        });

        setRecordedParts((prev) =>
          prev.includes(part) ? prev : [...prev, part]
        );

        // Lưu blob vào IndexedDB để không bị full localStorage
        await localforage.setItem(`ielts_speaking_blob_${part}`, blob);

        await handleUploadAndLog(blob, part);

        // Stop tracks
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      setRecordingPart(part);
      setTimer(300);

      clearIntervalTimer();
      intervalRef.current = setInterval(() => {
        setTimer((t) => {
          if (t <= 1) {
            clearIntervalTimer();
            recorder.stop();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } catch (err) {
      console.error("🚫 Microphone error:", err);
      alert("❌ Cannot access the microphone. Please allow permission!");
    }
  };

  const stopRecording = (part: number) => {
    const recorder = recorderRef.current;
    const stream = streamRef.current;
    if (!recorder) return;

    clearIntervalTimer();

    recorder.onstop = async () => {
      const mimeType = getSupportedMimeType();
      const blob = new Blob(chunksRef.current, { type: mimeType });

      if (blob.size === 0) {
        notify("⚠️ Không phát hiện âm thanh!", "error");
        return;
      }

      // Convert → base64 (để nghe lại)
      const base64 = await blobToBase64(blob);

      setAudioSrc((prev) => {
        const updated = { ...prev, [part]: base64 };
        localStorage.setItem("ielts_audio_base64", JSON.stringify(updated));
        bindAudioToCurrentSession();
        return updated;
      });

      setRecordedParts((prev) =>
        prev.includes(part) ? prev : [...prev, part]
      );

      // Save blob to IndexedDB
      await localforage.setItem(`ielts_speaking_blob_${part}`, blob);

      // Upload + log
      await handleUploadAndLog(blob, part);

      // Stop mic
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };

    recorder.stop();
    setRecordingPart(null);
  };

  const handleUploadAndLog = async (blob: Blob, part: number) => {
    if (!accessToken && APPS_SCRIPT_SUBMIT_ENABLED) {
      notify(
        "Audio da luu cuc bo. Khi bam ket thuc, he thong se gui truc tiep ve Google Sheet qua Apps Script.",
        "info"
      );
      return;
    }

    try {
      setUploading((prev) => ({ ...prev, [part]: true }));

      const formData = new FormData();
      formData.append("file", blob);
      if (accessToken) {
        formData.append("accessToken", accessToken);
      }
      formData.append("folderId", DRIVE_FOLDER_ID);

      const uploadRes = await apiCall<{ data: any }>("/api/upload", {
        method: "POST",
        formData,
      });

      const file = uploadRes.data;
      const fileLink = `https://drive.google.com/file/d/${file.id}/view`;
      const studentInfo = getStudentInfo();

      const logData: IeltsLogData = {
        name: studentInfo.fullName || "",
        email: studentInfo.email || "",
        part1:
          part === 1
            ? questions?.part1.map((q, i) => `${i + 1}. ${q}`).join("\n")
            : "",
        link1: part === 1 ? fileLink : "",
        part2:
          part === 2
            ? `${questions?.part2.topic}\n${questions?.part2.bullets
                .map((b) => `- ${b}`)
                .join("\n")}\nFollow-up: ${questions?.part2.followUp}`
            : "",
        link2: part === 2 ? fileLink : "",
        part3:
          part === 3
            ? `${questions?.part3.reading}\n\n${questions?.part3.questions
                .map((q, i) => `${i + 1}. ${q}`)
                .join("\n")}`
            : "",
        link3: part === 3 ? fileLink : "",
      };

      const uuid = localStorage.getItem("ielts_uuid");

      const logRes = await fetch("/api/log-to-sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken,
          sheetId: SHEET_ID,
          data: logData,
          uuid,
        }),
      });

      const result = await logRes.json();
      if (!logRes.ok || !result?.success) {
        throw new Error(result?.error || "Failed to write Speaking_list");
      }

      if (result?.uuid) {
        localStorage.setItem("ielts_uuid", result.uuid);
      }

      // Lưu link để submit speaking-report
      const arr = JSON.parse(localStorage.getItem("ielts_audio_links") || "[]");
      arr.push({ part, link: fileLink });
      localStorage.setItem("ielts_audio_links", JSON.stringify(arr));
    } catch (err: any) {
      console.error("❌ Upload or log error:", err);
      const message = String(err?.message || err);
      if (message.includes("Drive API")) {
        notify(
          "❌ Chưa bật Google Drive API. Vào Google Cloud Console → APIs → bật Google Drive API.",
          "error"
        );
      } else if (message.includes("Insufficient permissions")) {
        notify(
          "❌ Tài khoản Google chưa có quyền ghi vào folder Speaking. Hãy share folder với email đăng nhập (quyền Editor).",
          "error"
        );
      } else {
        notify("❌ Upload audio thất bại. Ghi âm đã lưu cục bộ.", "error");
      }
    } finally {
      setUploading((prev) => ({ ...prev, [part]: false }));
    }
  };

  const formatTimer = (time: number) =>
    `${String(Math.floor(time / 60)).padStart(2, "0")}:${String(
      time % 60
    ).padStart(2, "0")}`;

  const handleFinishTest = async () => {
    if (finishing) return;
    setFinishing(true);

    try {
      notify("📤 Đang nộp bài. Vui lòng chờ...", "info");

      // ===============================
      // 1. LẤY DỮ LIỆU LOCAL
      // ===============================
      const storedUserInfo = JSON.parse(
        localStorage.getItem("ielts_userInfo") || "{}"
      );
      const submitUserInfo = {
        ...storedUserInfo,
        ...getStudentInfo(),
      };
      const startTime = localStorage.getItem("ielts_startTime") || "";
      const uuid = localStorage.getItem("ielts_uuid") || undefined;

      const listeningObj = JSON.parse(
        localStorage.getItem("ielts_listening") || "{}"
      );

      const listening = [
        ...Array.from({ length: 16 }, (_, i) => listeningObj[i + 1] || ""),
        listeningObj[17] || "",
        listeningObj[19] || "",
      ];

      const readingObj = JSON.parse(
        localStorage.getItem("ielts_reading") || "{}"
      );

      const reading = Array.from({ length: 13 }, (_, i) => {
        return readingObj[i + 1] || "";
      });

      const writingAnswer =
        localStorage.getItem("ielts_writingAnswer") || "(no answer)";

      const speakingBase64 = await loadSpeakingAudioBase64();
      const audioLinks = JSON.parse(
        localStorage.getItem("ielts_audio_links") || "[]"
      );

      if (Object.values(uploading).some((value) => value === true)) {
        notify("Audio dang upload. Vui long cho 2-3 giay roi nop lai.", "error");
        return;
      }

      // ===============================
      // 2. SUBMIT IELTS MAIN API
      // ===============================

      const submitRes = await fetch("/api/submit-ielts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken,
          sheetId: SHEET_ID,
          uuid,
          data: {
            ...submitUserInfo,
            startTime,
            listening,
            writingAnswer,
            reading,
            speaking: {
              questions,
              audioBase64: speakingBase64,
              audioLinks,
              driveFolderId: DRIVE_FOLDER_ID,
            },
          },
        }),
      });

      const rawText = await submitRes.text();
      let submitJson;
      try {
        submitJson = JSON.parse(rawText);
      } catch (err) {
        console.error("❌ JSON parse failed:", err);
        console.error("Raw:", rawText);
        notify("Server trả về dữ liệu lỗi. Vui lòng thử lại.", "error");
        return;
      }

      if (!submitRes.ok || !submitJson.success) {
        const serverError =
          submitJson?.error ||
          (rawText.includes("OPENAI_API_KEY")
            ? "Chưa cấu hình OPENAI_API_KEY trong .env.local"
            : "Lỗi server khi nộp bài");
        notify(`❌ ${serverError}`, "error");
        console.error(submitJson || rawText);
        return;
      }

      // Speaking được chấm thủ công: admin bấm nút Evaluate trên Google Sheet
      if (Object.values(uploading).some((v) => v === true)) {
        notify("⏳ Đang upload audio... vui lòng chờ 2–3 giây!", "error");
        return;
      }

      if (Array.isArray(submitJson.warnings) && submitJson.warnings.length > 0) {
        notify(`⚠️ ${submitJson.warnings.join(" ")}`, "info");
      }

      notify(
        "🎉 Hoàn tất bài thi! Bài Speaking sẽ được chấm khi admin bấm Evaluate trên Google Sheet.",
        "success"
      );
      localStorage.setItem("ielts_finished", "true");
      onFinish?.();
    } catch (error) {
      notify("❌ Lỗi khi nộp bài", "error");
      console.error(error);
    } finally {
      setFinishing(false);
    }
  };

  /* ------------------------------ UI nhỏ ------------------------------ */

  const RecordButton = ({ part }: { part: number }) => {
    const isRecording = recordingPart === part;
    const isRecorded = recordedParts.includes(part);
    const isUploading = uploading[part];
    const isDisabled =
      isRecorded ||
      isUploading ||
      loadingQuestions ||
      !questions ||
      isFinished;

    return (
      <div className="flex flex-col items-center mt-6 space-y-3">
        <button
          onClick={() =>
            isRecording ? stopRecording(part) : startRecording(part)
          }
          disabled={isDisabled}
          className={`relative flex items-center justify-center rounded-full shadow-md transition-all duration-300 ${
            isDisabled
              ? "bg-gray-400 cursor-not-allowed w-14 h-14"
              : isRecording
              ? "bg-red-500 hover:bg-red-600 w-16 h-16"
              : "bg-linear-to-r from-[#0E4BA9] to-[#00A6FB] hover:opacity-90 w-14 h-14"
          }`}
        >
          {isUploading ? (
            <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
          ) : isRecording ? (
            <div className="w-3 h-3 bg-white rounded-sm" />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 1v10m0 0a3 3 0 01-3-3V5a3 3 0 016 0v3a3 3 0 01-3 3zm0 0v10m-6-4h12"
              />
            </svg>
          )}

          {isRecording && (
            <span className="absolute inset-0 rounded-full animate-ping bg-red-400 opacity-40" />
          )}
        </button>

        {isRecording && (
          <p className="text-gray-700 text-lg font-medium">
            {formatTimer(timer)}
          </p>
        )}
        {isUploading ? (
          <p className="text-blue-500 text-sm font-semibold">☁️ Uploading...</p>
        ) : isRecording ? (
          <p className="text-red-600 text-sm font-semibold">Recording...</p>
        ) : isRecorded ? (
          <p className="text-green-600 text-sm font-medium">✅ Completed</p>
        ) : (
          <p className="text-gray-500 text-sm">Click to start</p>
        )}

        {audioSrc[part] && (
          <div className="mt-3 w-full">
            {/* data:audio/wav;base64 → không tạo request 206 */}
            <audio
              controls
              src={audioSrc[part]}
              className="w-full rounded-xl"
            />
          </div>
        )}
      </div>
    );
  };

  /* ------------------------------ Render ------------------------------ */

  // if (isFinished) {
  //   return (
  //     <div className="min-h-screen flex flex-col items-center justify-center bg-linear-to-b from-[#EAF4FF] to-[#F9FAFB] font-[Lexend] text-center">
  //       <motion.img
  //         src="/logo.png"
  //         alt="WeWIN Logo"
  //         className="w-40 mb-8"
  //         animate={{ scale: [1, 1.1, 1] }}
  //         transition={{ repeat: Infinity, duration: 2 }}
  //       />
  //       <h1 className="text-3xl font-bold text-[#0E4BA9] mb-3">
  //         🎉 Bạn đã hoàn thành bài thi IELTS!
  //       </h1>
  //       <p className="text-gray-600 mb-6">
  //         Hệ thống đã lưu kết quả, bạn không thể bắt đầu lại bài thi này.
  //       </p>
  //       <a
  //         href="/"
  //         className="px-8 py-3 bg-linear-to-r from-[#0E4BA9] to-[#00A6FB] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition"
  //       >
  //         ⬅️ Quay lại trang chủ
  //       </a>
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen bg-linear-to-b from-[#EAF4FF] to-[#F9FAFB] text-center font-[Lexend] px-4 py-10">
      <h1 className="text-4xl font-bold text-[#0E4BA9] mb-3">
        🎙️ IELTS Speaking Test
      </h1>

      {!accessToken && (
        <p className="max-w-3xl mx-auto mb-6 text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm">
          Bạn đang đăng nhập bằng email/mật khẩu. Hệ thống sẽ dùng quyền Google
          phía server để upload và nộp bài nếu service account đã được cấu hình.
        </p>
      )}

      {/* Part 1 */}
      <section className="max-w-3xl mx-auto bg-white rounded-3xl shadow-lg p-8 mb-12 mt-8 border-l-8 border-[#0E4BA9]">
        <h2 className="text-2xl font-semibold text-[#0E4BA9] mb-4">
          🗣️ Part 1 – Introduction
        </h2>
        <ul className="text-gray-700 text-left list-disc ml-8 space-y-2 mb-6">
          {questions?.part1.map((q, i) => (
            <li key={i}>{q}</li>
          ))}
        </ul>
        <RecordButton part={1} />
      </section>

      {/* Part 2 */}
      <section className="max-w-3xl mx-auto bg-white rounded-3xl shadow-lg p-8 mb-12 border-l-8 border-[#00A6FB]">
        <h2 className="text-2xl font-semibold text-[#00A6FB] mb-4">
          💬 Part 2 – Cue Card
        </h2>
        <p className="text-gray-800 font-medium mb-3">
          {questions?.part2.topic}
        </p>
        <ul className="text-gray-700 list-disc ml-8 mb-3 space-y-1 text-left">
          {questions?.part2.bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
        <p className="italic text-gray-600 mb-6">
          Follow-up: {questions?.part2.followUp}
        </p>
        <RecordButton part={2} />
      </section>

      {/* Part 3 */}
      <section className="max-w-3xl mx-auto bg-white rounded-3xl shadow-lg p-8 mb-10 border-l-8 border-[#0E4BA9]">
        <h2 className="text-2xl font-semibold text-[#0E4BA9] mb-4">
          📖 Part 3 – Discussion
        </h2>
        <p className="text-gray-700 bg-gray-50 p-4 rounded-xl mb-4 text-sm leading-relaxed">
          {questions?.part3.reading}
        </p>
        <ul className="text-gray-700 list-disc ml-8 space-y-2 text-left">
          {questions?.part3.questions.map((q, i) => (
            <li key={i}>{q}</li>
          ))}
        </ul>
        <RecordButton part={3} />
      </section>

      {/* Nút kết thúc bài thi */}
      <div className="mt-12 mb-10">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowConfirm(true)}
          className="px-10 py-4 bg-linear-to-r from-green-500 to-emerald-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-lg"
        >
          🎯 KẾT THÚC BÀI THI
        </motion.button>
        <p className="text-gray-500 text-sm mt-3">
          Sau khi kết thúc, bạn sẽ không thể thi lại hoặc ghi âm lại nữa.
        </p>
      </div>
      <Notification
        message={message}
        type={type}
        visible={visible}
        onClose={close}
      />
      <ConfirmPopup
        visible={showConfirm}
        title="Kết thúc bài thi?"
        description="Sau khi kết thúc, bạn sẽ không thể ghi âm hoặc thay đổi câu trả lời nữa."
        onCancel={() => setShowConfirm(false)}
        onConfirm={() => {
          setShowConfirm(false);
          handleFinishTest();
        }}
      />
      {finishing && (
        <div
          className="
      fixed inset-0 z-99999
      bg-black/60 backdrop-blur-sm
      flex flex-col items-center justify-center
      text-white
    "
        >
          <div className="animate-spin w-14 h-14 border-4 border-white border-t-transparent rounded-full"></div>
          <p className="mt-6 text-lg font-semibold">
            Đang nộp bài... vui lòng không thao tác
          </p>
        </div>
      )}
    </div>
  );
}
