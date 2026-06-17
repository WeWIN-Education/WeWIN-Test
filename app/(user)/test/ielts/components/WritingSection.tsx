"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

// ⭐ Import Notification + hook
import Notification from "@/app/components/notification";
import { useNotification } from "@/app/utils/useNotification";

interface WritingSectionProps {
  onNext?: () => void;
}

export default function WritingSection({ onNext }: WritingSectionProps) {
  // ⭐ Hook notification
  const { notify, visible, message, type, close } = useNotification();

  const [answer, setAnswer] = useState("");
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes
  const [isSubmitted, setIsSubmitted] = useState(false);

  // 🕒 Countdown timer
  useEffect(() => {
    if (timeLeft <= 0 || isSubmitted) return;
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isSubmitted]);

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(
      2,
      "0"
    )}`;

  const handleSubmit = () => {
    setIsSubmitted(true);

    // 🔥 LƯU vào localStorage
    localStorage.setItem("ielts_writingAnswer", answer);

    notify("✅ Bài Writing của bạn đã được nộp thành công!", "success");

    setTimeout(() => {
      onNext?.();
    }, 600);
  };

  return (
    <>
      {/* ⭐ Notification UI */}
      <Notification
        visible={visible}
        message={message}
        type={type}
        onClose={close}
      />

      <div className="min-h-screen bg-linear-to-b from-[#EAF4FF] to-[#F9FAFB] font-[Lexend] px-4 py-10">
        <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-3xl p-8 border border-[#B8D7F9]/50">
          <h1 className="text-4xl font-bold text-[#0E4BA9] mb-3 text-center">
            📝 IELTS Writing Test
          </h1>

          {/* Timer */}
          <div
            className={`text-center mb-6 text-2xl font-semibold ${
              timeLeft < 60 ? "text-red-500 animate-pulse" : "text-[#0E4BA9]"
            }`}
          >
            ⏰ {formatTime(timeLeft)}
          </div>

          {/* Question */}
          <div className="bg-[#F8FBFF] p-6 rounded-2xl shadow-inner mb-8">
            <h2 className="text-lg font-medium text-gray-700 leading-relaxed">
              <strong>Question:</strong> Some people prefer online shopping to traditional shopping in stores. What are the advantages and disadvantages of this trend? You should write at least 150 words.
            </h2>
          </div>

          {/* Answer box */}
          {!isSubmitted ? (
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="✍️ Viết bài của bạn tại đây..."
              className="w-full min-h-[250px] border border-[#B8D7F9] rounded-2xl p-4 text-gray-700 focus:ring-2 focus:ring-[#0E4BA9] outline-none resize-none shadow-sm"
            />
          ) : (
            <div className="bg-green-50 border border-green-300 rounded-2xl p-4 text-green-700 font-medium">
              ✅ Bạn đã nộp bài viết thành công!
            </div>
          )}

          {/* Submit button */}
          {!isSubmitted && (
            <div className="text-center mt-8">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSubmit}
                className="px-10 py-4 bg-linear-to-r from-[#0E4BA9] to-[#00A6FB] text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-lg"
              >
                🚀 NỘP BÀI WRITING
              </motion.button>
              <p className="text-gray-500 text-sm mt-3">
                *Bạn chỉ có thể nộp 1 lần. Hãy kiểm tra kỹ trước khi nộp.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
