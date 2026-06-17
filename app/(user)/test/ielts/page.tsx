"use client";

import { useState, ChangeEvent, useEffect } from "react";
import { motion } from "framer-motion";
import { InputField } from "@/app/components/input";
import ReadingSection from "./components/ReadingSection";
import WritingSection from "./components/WritingSection";
import SpeakingSection from "./components/SpeakingSection";
import ListeningSection from "./components/ListeningSection";
import { formatDateFromInput, formatTimestamp } from "@/app/utils/format";
import InputDate from "@/app/components/inputDate";
import Notification from "@/app/components/notification";
import { useNotification } from "@/app/utils/useNotification";
import { useSession } from "next-auth/react";
import { apiCall } from "@/app/utils/apiClient";
import Timer from "@/app/components/timer";
import { clearIeltsTestProgress } from "@/app/utils/ieltsStorage";
import { getIeltsSheetId } from "@/app/lib/googleSheetsConfig";

// 🔥 TIMER TÁCH RIÊNG

interface UserInfo {
  fullName: string;
  birthDate: string;
  location: string;
  phone: string;
  email: string;
  consultant: string;
  ieltsNeed: string;
  ieltsOther?: string;
  selfScore: string;
  studyTime: string;
}

type Stage = "form" | "listening" | "writing" | "reading" | "speaking" | "done";

export default function IELTSPage() {
  const { notify, visible, message, type, close } = useNotification();
  const { data: clientSession } = useSession();
  const [stage, setStage] = useState<Stage>("form");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [stage]);

  const [userInfo, setUserInfo] = useState<UserInfo>({
    fullName: "",
    birthDate: "",
    location: "",
    phone: "",
    email: "",
    consultant: "",
    ieltsNeed: "",
    ieltsOther: "",
    selfScore: "",
    studyTime: "",
  });

  /* ------------------------------------------------------------------
      HANDLE INPUT
  ------------------------------------------------------------------ */
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "birthDate") {
      const formatted = formatDateFromInput(value);
      setUserInfo((prev) => ({ ...prev, birthDate: formatted }));
      return;
    }

    setUserInfo((prev) => ({ ...prev, [name]: value }));
  };

  const isFormValid = Object.entries(userInfo).every(([key, val]) => {
    if (key === "ieltsOther" && userInfo.ieltsNeed !== "Khác") return true;
    return String(val).trim() !== "";
  });

  /* ------------------------------------------------------------------
      START TEST
  ------------------------------------------------------------------ */
  const handleStart = async () => {
    if (!isFormValid) {
      notify("❗ Vui lòng điền đầy đủ thông tin!", "error");
      return;
    }

    const accessToken =
      clientSession?.provider === "google" &&
      typeof clientSession.accessToken === "string"
        ? clientSession.accessToken
        : undefined;
    const sheetId = getIeltsSheetId();

    try {
      // 1️⃣ Kiểm tra đã thi chưa
      if (accessToken) {
        await apiCall<{ exists: boolean }>("/api/check-ielts", {
          method: "POST",
          body: {
            accessToken,
            sheetId,
            email: userInfo.email,
          },
        });

        // if (checkData.exists) {
        //   notify("⚠️ Bạn đã làm bài thi rồi! Không thể thi lại.", "error");
        //   return;
        // }
      } else {
        notify(
          "Dang nhap email/mat khau. Bai nop se gui ve Google Sheet qua Apps Script khi ket thuc bai thi.",
          "info"
        );
      }

      // 2️⃣ Xóa dữ liệu bài thi cũ (tránh hiện "Completed" từ lần trước)
      await clearIeltsTestProgress();

      const date = formatTimestamp();

      localStorage.setItem("ielts_startTime", date);
      localStorage.setItem("ielts_userInfo", JSON.stringify(userInfo));
      const startAt = Date.now();
      localStorage.setItem("ielts_startAt", String(startAt));

      // 3️⃣ Bắt đầu Grammar
      setStage("listening");
      notify("🚀 Bắt đầu bài thi!", "success");
    } catch (err: any) {
      notify("❌ Lỗi khi kiểm tra thông tin thi!", "error");
      console.error(err);
    }
  };

  const handleNext = (next: Stage) => setStage(next);

  /* ------------------------------------------------------------------
      TEST SECTIONS
  ------------------------------------------------------------------ */
  const TimerWrapper = () =>
    stage !== "form" && (
      <Timer
        minutes={60}
        onTimeout={() => {
          notify("⏳ Hết giờ! Hệ thống sẽ tự động nộp bài.", "error");
          setStage("done");
        }}
      />
    );

  if (stage === "listening")
    return (
      <>
        <Notification
          visible={visible}
          message={message}
          type={type}
          onClose={close}
        />
        <TimerWrapper />
        <ListeningSection onNext={() => handleNext("writing")} />
      </>
    );

  if (stage === "writing")
    return (
      <>
        <Notification
          visible={visible}
          message={message}
          type={type}
          onClose={close}
        />
        <TimerWrapper />
        <WritingSection
          onNext={() => {
            notify("Đã lưu Writing! Chuyển sang Reading...", "success");
            handleNext("reading");
          }}
        />
      </>
    );

  if (stage === "reading")
    return (
      <>
        <Notification
          visible={visible}
          message={message}
          type={type}
          onClose={close}
        />
        <TimerWrapper />
        <ReadingSection onNext={() => handleNext("speaking")} />
      </>
    );

  if (stage === "speaking")
    return (
      <>
        <Notification
          visible={visible}
          message={message}
          type={type}
          onClose={close}
        />
        <TimerWrapper />
        <SpeakingSection
          userInfo={userInfo}
          onFinish={() => handleNext("done")}
        />
      </>
    );

  if (stage === "done")
    return (
      <>
        <Notification
          visible={visible}
          message={message}
          type={type}
          onClose={close}
        />

        <div className="min-h-screen flex flex-col items-center justify-center bg-linear-to-b from-[#EAF4FF] to-[#F9FAFB] font-[Lexend] text-center">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl font-bold text-[#0E4BA9] mb-4"
          >
            🎉 Hoàn tất bài thi IELTS!
          </motion.h1>
          <p className="text-gray-600">
            Cảm ơn bạn <b>{userInfo.fullName}</b> đã hoàn thành bài thi thử của
            WeWIN IELTS.
          </p>
        </div>
      </>
    );

  /* ------------------------------------------------------------------
      FORM BEFORE TEST
  ------------------------------------------------------------------ */
  return (
    <>
      <Notification
        visible={visible}
        message={message}
        type={type}
        onClose={close}
      />

      <div className="min-h-screen bg-linear-to-b from-[#EAF4FF] to-[#F9FAFB] font-[Lexend] flex flex-col items-center justify-center px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative max-w-3xl w-full bg-white/95 backdrop-blur-xl border border-[#B8D7F9]/70 rounded-3xl shadow-[0_8px_30px_rgba(14,75,169,0.1)] p-10 overflow-hidden"
        >
          <div className="absolute inset-0 bg-linear-to-br from-[#e0f0fd] to-[#EAF4FF] opacity-90 rounded-3xl"></div>

          <div className="relative z-10">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex justify-center mb-6"
            >
              <img
                src="/logo.png"
                alt="WeWIN Logo"
                className="w-52 drop-shadow-md"
              />
            </motion.div>

            <h1 className="text-3xl md:text-4xl font-extrabold text-[#0E4BA9] mb-3 text-center">
              IELTS Test — <span className="text-[#007BCE]">WeWIN IELTS</span>
            </h1>

            {/* FORM INPUT */}
            <form className="text-left grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField
                label="Họ & tên"
                name="fullName"
                value={userInfo.fullName}
                onChange={handleChange}
                required
              />

              <InputDate
                label="Ngày sinh"
                name="birthDate"
                value={userInfo.birthDate}
                required
                onChange={(name, value) =>
                  setUserInfo((prev) => ({ ...prev, [name]: value }))
                }
              />

              <InputField
                label="Khu vực học tập/làm việc"
                name="location"
                value={userInfo.location}
                onChange={handleChange}
                required
                fullWidth
              />

              <InputField
                label="Số điện thoại"
                name="phone"
                value={userInfo.phone}
                onChange={handleChange}
                required
              />

              <InputField
                label="Email"
                name="email"
                value={userInfo.email}
                onChange={handleChange}
                required
              />

              <InputField
                label="Nhân viên tư vấn"
                name="consultant"
                value={userInfo.consultant}
                onChange={handleChange}
                required
                fullWidth
              />

              {/* Nhu cầu IELTS */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-[#0E4BA9] mb-3">
                  Nhu cầu IELTS <span className="text-red-500">*</span>
                </label>

                <div className="flex flex-wrap gap-4">
                  {["Đi học", "Đi định cư", "Đi làm", "Khác"].map((option) => (
                    <label
                      key={option}
                      className="flex items-center gap-2 bg-[#F7FAFF] border border-[#B8D7F9]/50 rounded-xl px-4 py-2 cursor-pointer hover:border-[#0E4BA9]"
                    >
                      <input
                        required
                        type="radio"
                        name="ieltsNeed"
                        value={option}
                        checked={userInfo.ieltsNeed === option}
                        onChange={handleChange}
                        className="accent-[#0E4BA9] w-4 h-4"
                      />
                      <span className="text-gray-700 font-medium">
                        {option}
                      </span>
                    </label>
                  ))}
                </div>

                {userInfo.ieltsNeed === "Khác" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="mt-4"
                  >
                    <input
                      type="text"
                      name="ieltsOther"
                      value={userInfo.ieltsOther}
                      onChange={handleChange}
                      placeholder="Vui lòng ghi rõ..."
                      className="w-full px-4 py-3 border border-[#B8D7F9] rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0E4BA9] transition-all"
                      required
                    />
                  </motion.div>
                )}
              </div>

              {/* Điểm tự đánh giá */}
              <div className="md:col-span-2 mb-3">
                <label className="block text-sm font-semibold text-[#0E4BA9] mb-3">
                  Điểm tự đánh giá theo chuẩn IELTS{" "}
                  <span className="text-red-500">*</span>
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    {
                      score: "9.0",
                      label: "Thông thạo",
                      desc: "Sử dụng ngôn ngữ linh hoạt, trôi chảy hoàn toàn.",
                    },
                    {
                      score: "8.0",
                      label: "Rất tốt",
                      desc: "Sử dụng rất tốt, đôi khi có lỗi nhỏ không đáng kể.",
                    },
                    {
                      score: "7.0",
                      label: "Tốt",
                      desc: "Nắm vững ngôn ngữ, đôi khi sai nhưng truyền đạt tốt.",
                    },
                    {
                      score: "6.0",
                      label: "Khá",
                      desc: "Giao tiếp tốt trong nhiều tình huống nhưng đôi lúc thiếu tự nhiên.",
                    },
                    {
                      score: "5.0",
                      label: "Bình thường",
                      desc: "Hiểu và giao tiếp trong tình huống quen thuộc nhưng còn hạn chế.",
                    },
                    {
                      score: "4.0",
                      label: "Hạn chế",
                      desc: "Khả năng giao tiếp hạn chế, chỉ dùng được trong tình huống quen thuộc.",
                    },
                    {
                      score: "3.0",
                      label: "Cực kì hạn chế",
                      desc: "Chỉ hiểu tổng quan, rất khó diễn đạt.",
                    },
                    {
                      score: "2.0",
                      label: "Kém",
                      desc: "Khó giao tiếp thực tế, dùng rất ít cấu trúc đúng.",
                    },
                    {
                      score: "1.0",
                      label: "Không biết sử dụng",
                      desc: "Hoàn toàn không biết sử dụng tiếng Anh.",
                    },
                    {
                      score: "0",
                      label: "Bỏ thi",
                      desc: "Không giao tiếp được hoặc không thực hiện bài thi.",
                    },
                  ].map((item) => (
                    <label
                      key={item.score}
                      className={`cursor-pointer border rounded-2xl p-4 bg-[#F7FAFF] border-[#B8D7F9]/50 hover:border-[#0E4BA9] transition ${
                        userInfo.selfScore === item.score
                          ? "ring-2 ring-[#0E4BA9]"
                          : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="selfScore"
                          value={item.score}
                          checked={userInfo.selfScore === item.score}
                          onChange={handleChange}
                          className="mt-1 w-5 h-5 accent-[#0E4BA9]"
                          required
                        />
                        <div>
                          <div className="font-bold text-[#0E4BA9] text-lg">
                            {item.score} – {item.label}
                          </div>
                          <div className="text-gray-600 text-sm">
                            {item.desc}
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </form>

            <InputField
              label="Thời gian học mỗi tuần"
              name="studyTime"
              value={userInfo.studyTime}
              onChange={handleChange}
              required
            />

            {/* BUTTON START */}
            <div className="flex justify-center mt-8">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStart}
                className={`flex items-center gap-2 px-10 py-4 rounded-2xl text-white font-bold text-lg shadow-lg 
                  ${
                    isFormValid
                      ? "bg-linear-to-r from-[#0E4BA9] to-[#00A6FB]"
                      : "bg-gray-400 cursor-not-allowed"
                  }`}
              >
                🚀 BẮT ĐẦU THI
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
