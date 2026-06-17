"use client";

import { useState } from "react";
import { motion, easeOut } from "framer-motion";
import { GraduationCap, BookOpen, Search, ArrowLeft } from "lucide-react";
import { useSession } from "next-auth/react";
import { initialData } from "@/app/constants/class";
import AnimatedClassBlock from "../components/animatedClassBlock";

export default function ResourcePage() {
  const { data: session, status } = useSession();

  // 🧠 Form tra cứu (khi chưa login)
  const [manualInput, setManualInput] = useState("");
  const [enteredIdOrEmail, setEnteredIdOrEmail] = useState<string | null>(null);

  // 🧩 Nếu đã login → lấy ID hoặc email từ session
  const currentStudentIdOrEmail =
    session?.user?.id || session?.user?.email || enteredIdOrEmail;

  // 🔹 Lọc lớp học mà học sinh đang học
  const enrolledClasses =
    currentStudentIdOrEmail
      ? initialData.filter((cls) =>
          cls.students.some(
            (stu) =>
              stu.id.toLowerCase() ===
                currentStudentIdOrEmail.toLowerCase() ||
              stu.email?.toLowerCase() ===
                currentStudentIdOrEmail.toLowerCase()
          )
        )
      : [];

  // 🕓 Trạng thái loading
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-600 font-[Lexend]">
        Đang tải thông tin đăng nhập...
      </div>
    );
  }

  // =============================
  // 🔹 GIAO DIỆN TRA CỨU (chưa đăng nhập & chưa nhập ID/email)
  // =============================
  if (!session && !enteredIdOrEmail) {
    return (
      <div className="min-h-[calc(80vh-60px)] flex flex-col justify-center items-center bg-linear-to-br from-blue-50 via-white to-blue-50 font-[Lexend] px-6 relative overflow-hidden">
        {/* 🌈 Hiệu ứng nền */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-[30rh-120rem] bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-1000"></div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: easeOut }}
          className="max-w-2xl w-full bg-white/80 backdrop-blur-xl p-12 rounded-3xl shadow-2xl border border-blue-100 text-center relative z-10"
        >
          {/* 🔹 Icon gradient */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-24 h-24 bg-linear-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg"
          >
            <BookOpen className="w-12 h-12 text-white" />
          </motion.div>

          <h2 className="text-3xl font-extrabold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">
            Tra cứu tài nguyên học sinh
          </h2>
          <p className="text-gray-600 text-base mb-10 leading-relaxed">
            Nhập <span className="font-semibold text-blue-600">ID học sinh </span> 
            hoặc <span className="font-semibold text-indigo-600">Email</span> để xem tài nguyên học tập của bạn.
          </p>

          {/* Ô nhập */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <input
              type="text"
              placeholder="Nhập Student ID hoặc Email"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && manualInput.trim()) {
                  setEnteredIdOrEmail(manualInput.trim());
                }
              }}
              className="flex-1 w-full border-2 border-gray-200 rounded-xl px-6 py-4 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all duration-300 text-gray-800 placeholder:text-gray-400 text-base shadow-sm"
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (manualInput.trim()) {
                  setEnteredIdOrEmail(manualInput.trim());
                }
              }}
              className="w-full sm:w-auto bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Search className="w-5 h-5" />
              <span>Tra cứu ngay</span>
            </motion.button>
          </div>

          {/* Gợi ý */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              💡 <span className="font-medium">Mẹo:</span> Bạn có thể nhập{" "}
              <strong>ID học sinh</strong> hoặc <strong>Email</strong>.  
              Bấm <strong>Enter</strong> để tra cứu nhanh 🔎
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // =============================
  // 🔹 Khi đã login hoặc đã nhập ID/email
  // =============================
  return (
    <div className="min-h-screen bg-gray-50 font-[Lexend]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: easeOut }}
        className="bg-linear-to-r from-[#003c97] to-[#028ace]
                   text-white py-10 px-6 shadow-md"
      >
        <div className="max-w-7xl mx-auto flex flex-col gap-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <GraduationCap className="w-10 h-10 text-[#E4C28E]" />
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                Tài Nguyên Học Tập
              </h1>
            </div>

            {/* 🔙 Nút quay lại chỉ hiện nếu người dùng nhập tay ID/email */}
            {!session && enteredIdOrEmail && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setEnteredIdOrEmail(null)}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 
                           text-white px-4 py-2 rounded-xl font-semibold text-sm transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                Quay lại tra cứu khác
              </motion.button>
            )}
          </div>

          <p className="text-[#E0F2FF] text-sm md:text-base">
            Dưới đây là các tài nguyên học tập bạn có thể truy cập.
          </p>
        </div>
      </motion.div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
        {enrolledClasses.length > 0 ? (
          enrolledClasses.map((cls) => (
            <AnimatedClassBlock key={cls.id} cls={cls} />
          ))
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="text-center py-20"
          >
            <div className="inline-block bg-gray-100 p-6 rounded-full mb-5">
              <BookOpen className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">
              Không tìm thấy lớp học nào
            </h2>
            <p className="text-gray-500 text-sm">
              Hãy kiểm tra lại ID hoặc Email của bạn 🎯
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
