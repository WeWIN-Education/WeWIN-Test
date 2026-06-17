"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Notification from "@/app/components/notification";
import { listeningPart2, listeningTable } from "@/app/constants/listening";

interface ListeningSectionProps {
  onNext: () => void;
}

export default function ListeningSection({ onNext }: ListeningSectionProps) {
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [notification, setNotification] = useState({
    visible: false,
    message: "",
    type: "info" as "info" | "success" | "error",
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [reviewMode, setReviewMode] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const handleChange = (id: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = () => {
    localStorage.setItem("ielts_listening", JSON.stringify(answers));
    setNotification({
      visible: true,
      type: "success",
      message: "✅ Hoàn thành phần Listening! Chuyển sang phần tiếp theo...",
    });

    setTimeout(onNext, 1800);
  };

  /** Render text + input */
  const renderInputText = (text: string, q?: number) => {
    if (!text.includes("__________")) {
      return <span className="wrap-break-word">{text}</span>;
    }

    const parts = text.split("__________");

    return (
      <span className="inline-flex items-center gap-2 flex-wrap">
        <span className="wrap-break-word">{parts[0]}</span>

        <input
          type="text"
          value={q ? answers[q] || "" : ""}
          onChange={(e) => q && handleChange(q, e.target.value)}
          placeholder={q ? `(${q})` : ""}
          className="w-28 bg-transparent border-0 border-b-2 border-[#0E4BA9]
                   outline-none text-center font-semibold text-[#0E4BA9]
                   placeholder:text-gray-400"
        />

        <span className="wrap-break-word">{parts[1]}</span>
      </span>
    );
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    let lastTime = 0;

    const updateTime = () => {
      lastTime = audio.currentTime;

      setCurrentTime(audio.currentTime);
      setDuration(audio.duration || 0);

      const percent = (audio.currentTime / audio.duration) * 100;
      setProgress(isNaN(percent) ? 0 : percent);
    };

    const blockSeeking = () => {
      audio.currentTime = lastTime;
    };

    const lockAtEnd = () => {
      setHasPlayed(true);
      audio.pause();
      audio.currentTime = audio.duration;

      // Bắt đầu chế độ xem lại
      setReviewMode(true);

      // Bắt đầu đếm ngược 60s
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownRef.current!);
            handleSubmit(); // Auto submit
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("seeking", blockSeeking);
    audio.addEventListener("ended", lockAtEnd);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("seeking", blockSeeking);
      audio.removeEventListener("ended", lockAtEnd);

      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return "00:00";
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleChoice = (q: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [q]: value }));
  };

  const handleMultiChoice = (q: number, value: string) => {
    setAnswers((prev) => {
      const current = prev[q] ? prev[q].split(", ").map((s) => s.trim()) : [];

      if (current.includes(value)) {
        // Bỏ chọn → remove value
        const newArr = current.filter((v) => v !== value);
        return { ...prev, [q]: newArr.join(", ") };
      } else {
        // Nếu đã chọn đủ 2 thì không thêm nữa
        if (current.length >= 2) return prev;

        const newArr = [...current, value];
        return { ...prev, [q]: newArr.join(", ") };
      }
    });
  };

  return (
    <>
      <Notification
        visible={notification.visible}
        type={notification.type}
        message={notification.message}
        onClose={() => setNotification((p) => ({ ...p, visible: false }))}
      />

      <div className="min-h-screen bg-linear-to-b from-[#EAF4FF] to-[#F9FAFB] font-[Lexend] px-4 py-10 text-black">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto bg-white p-8 rounded-3xl shadow-lg"
        >
          {/* ================= HEADER ================= */}
          <h1 className="text-3xl font-bold text-[#0E4BA9] mb-3">
            🎧 LISTENING
          </h1>

          {/* ================= AUDIO PLAYER ONE-TIME ================= */}
          <div className="mb-8 max-w-xl mx-auto rounded-3xl p-6 bg-linear-to-r from-[#0E4BA9]/10 to-[#00A6FB]/10 border border-[#0E4BA9]/20 shadow-lg">
            {/* Audio ẩn – chỉ chạy bằng code */}
            <audio ref={audioRef} preload="auto">
              <source src="/audio/listening.mp4" type="audio/mp4" />
              Trình duyệt của bạn không hỗ trợ audio.
            </audio>

            {/* Progress + Time */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-xs text-gray-600 font-medium">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>

              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-[#0E4BA9] to-[#00A6FB] transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Button Start / Locked */}
            {!hasPlayed ? (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => audioRef.current?.play()}
                className="w-full py-3 rounded-xl font-bold text-white bg-linear-to-r from-[#0E4BA9] to-[#00A6FB] shadow-md hover:brightness-110 transition"
              >
                ▶ BẮT ĐẦU BÀI NGHE
              </motion.button>
            ) : (
              <div className="w-full py-3 rounded-xl text-center text-sm bg-gray-200 text-gray-500 font-semibold">
                🔒 Bài nghe đã kết thúc – không thể phát lại
              </div>
            )}

            {/* Note */}
            <p className="mt-3 text-xs italic text-gray-500 text-center">
              * Audio chỉ được phát duy nhất một lần. Không thể tua, pause hoặc
              nghe lại.
            </p>
            <p className="text-xs italic text-gray-500 text-center">
              * Sau khi kết thúc có 1 phút để kiểm tra lại trước khi hệ thống tự
              động submit.
            </p>
          </div>

          {reviewMode && (
            <div className="text-center mt-6">
              <div className="inline-block bg-yellow-100 border border-yellow-400 text-yellow-700 px-6 py-3 rounded-xl font-semibold">
                ⏳ Bạn có {countdown}s để xem lại đáp án. Bài sẽ tự động nộp khi
                hết thời gian.
              </div>
            </div>
          )}

          <p className="text-3xl mb-2 font-semibold">Part 1</p>
          <p className="mb-2 font-semibold">Questions 1–10</p>
          <p className="italic mb-1">Complete the notes below.</p>
          <p className="mb-6">
            Write <b>ONE WORD AND/OR A NUMBER</b> for each answer.
          </p>

          {/* ================= TABLE ================= */}
          <div className="hidden md:block border-2 border-black">
            <div className="grid grid-cols-4 border-b-2 border-black bg-gray-100 font-bold">
              <div className="p-4 border-r-2">Name of restaurant</div>
              <div className="p-4 border-r-2">Location</div>
              <div className="p-4 border-r-2">Reason for recommendation</div>
              <div className="p-4">Other comments</div>
            </div>

            {listeningTable.map((row, i) => (
              <div
                key={i}
                className="grid grid-cols-4 border-b-2 border-black last:border-b-0"
              >
                <div className="p-4 border-r-2 font-semibold">
                  {renderInputText(row.name.text, row.name.q)}
                </div>

                <div className="p-4 border-r-2">
                  {renderInputText(row.location.text, row.location.q)}
                </div>

                <div className="p-4 border-r-2 space-y-1">
                  {row.reason.map((r, idx) => (
                    <div key={idx}>{renderInputText(r.text, r.q)}</div>
                  ))}
                </div>

                <div className="p-4 space-y-1">
                  {row.comments.map((c, idx) => (
                    <div key={idx}>{renderInputText(c.text, c.q)}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* ✅ MOBILE - CARD DỌC RẤT DỄ LÀM BÀI */}
          <div className="md:hidden flex flex-col gap-6">
            {listeningTable.map((row, i) => (
              <div
                key={i}
                className="border-2 border-black rounded-xl p-4 space-y-4"
              >
                <div>
                  <p className="text-sm font-bold text-gray-700 mb-1">
                    Name of restaurant
                  </p>
                  {renderInputText(row.name.text, row.name.q)}
                </div>

                <div>
                  <p className="text-sm font-bold text-gray-700 mb-1">
                    Location
                  </p>
                  {renderInputText(row.location.text, row.location.q)}
                </div>

                <div>
                  <p className="text-sm font-bold text-gray-700 mb-1">
                    Reason for recommendation
                  </p>
                  {row.reason.map((r, idx) => (
                    <div key={idx}>{renderInputText(r.text, r.q)}</div>
                  ))}
                </div>

                <div>
                  <p className="text-sm font-bold text-gray-700 mb-1">
                    Other comments
                  </p>
                  {row.comments.map((c, idx) => (
                    <div key={idx}>{renderInputText(c.text, c.q)}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* ================= PART 2 – QUESTIONS 11–16 (BEAUTIFIED) ================= */}
          <div className="mt-20">
            <h2 className="text-3xl font-semibold">Part 2</h2>

            <p className="mb-2 font-semibold text-lg">Questions 11–16</p>
            <p className="italic mb-8 text-gray-600">
              Choose the correct letter, A, B or C.
            </p>

            <div className="grid gap-8">
              {listeningPart2.questions11to16.map((item) => (
                <div
                  key={item.q}
                  className="rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition bg-[#FAFBFF]"
                >
                  <p className="font-semibold mb-4">
                    {item.q}. {item.question}
                  </p>

                  <div className="space-y-3">
                    {Object.entries(item.options).map(([key, text]) => {
                      const checked = answers[item.q] === key;

                      return (
                        <label
                          key={key}
                          className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer border transition
                ${
                  checked
                    ? "border-[#0E4BA9] bg-[#0E4BA9]/10"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
                        >
                          <input
                            type="radio"
                            name={`q-${item.q}`}
                            checked={checked}
                            onChange={() => handleChoice(item.q, key)}
                            className="scale-110 accent-[#0E4BA9]"
                          />

                          <span className="flex-1">
                            <b className="mr-1">{key}.</b> {text}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ================= PART 2 – QUESTIONS 17–18 (BEAUTIFIED) ================= */}
          <div className="mt-16">
            <p className="mb-2 font-semibold text-lg">Questions 17 and 18</p>
            <p className="italic mb-4 text-gray-600">
              Choose TWO letters, A–E.
            </p>

            <div className="rounded-2xl border border-gray-200 p-6 bg-[#FAFBFF] shadow-sm">
              <p className="font-semibold mb-6">
                {listeningPart2.questions17to18.title}
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                {Object.entries(listeningPart2.questions17to18.options).map(
                  ([key, text]) => {
                    const checked = !!answers[17]?.includes(key);

                    return (
                      <label
                        key={key}
                        className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer border transition
              ${
                checked
                  ? "border-[#0E4BA9] bg-[#0E4BA9]/10"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleMultiChoice(17, key)}
                          className="scale-110 accent-[#0E4BA9]"
                        />

                        <span>
                          <b className="mr-1">{key}.</b> {text}
                        </span>
                      </label>
                    );
                  }
                )}
              </div>
            </div>
          </div>

          {/* ================= PART 2 – QUESTIONS 19–20 (BEAUTIFIED) ================= */}
          <div className="mt-16">
            <p className="mb-2 font-semibold text-lg">Questions 19 and 20</p>
            <p className="italic mb-4 text-gray-600">
              Choose TWO letters, A–E.
            </p>

            <div className="rounded-2xl border border-gray-200 p-6 bg-[#FAFBFF] shadow-sm">
              <p className="font-semibold mb-6">
                {listeningPart2.questions19to20.title}
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                {Object.entries(listeningPart2.questions19to20.options).map(
                  ([key, text]) => {
                    const checked = !!answers[19]?.includes(key);

                    return (
                      <label
                        key={key}
                        className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer border transition
              ${
                checked
                  ? "border-[#0E4BA9] bg-[#0E4BA9]/10"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleMultiChoice(19, key)}
                          className="scale-110 accent-[#0E4BA9]"
                        />

                        <span>
                          <b className="mr-1">{key}.</b> {text}
                        </span>
                      </label>
                    );
                  }
                )}
              </div>
            </div>
          </div>

          {reviewMode && (
            <div className="text-center mt-6">
              <div className="inline-block bg-yellow-100 border border-yellow-400 text-yellow-700 px-6 py-3 rounded-xl font-semibold">
                ⏳ Bạn có {countdown}s để xem lại đáp án. Bài sẽ tự động nộp khi
                hết thời gian.
              </div>
            </div>
          )}

          {/* ================= SUBMIT ================= */}
          <div className="text-center mt-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmit}
              className="px-10 py-4 bg-linear-to-r from-[#0E4BA9] to-[#00A6FB] text-white font-bold rounded-2xl shadow-lg"
            >
              ✅ Nộp bài Listening
            </motion.button>
          </div>
        </motion.div>
      </div>
    </>
  );
}
