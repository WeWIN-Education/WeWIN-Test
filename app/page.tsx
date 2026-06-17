"use client";

import { motion } from "framer-motion";

export default function HomePage() {
  return (
    <div className="font-[Lexend] bg-[#f5f8fc] min-h-screen text-[#1a1a1a]">
      {/* =========================
          HERO SECTION
      ========================== */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 pt-28 pb-32 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-5xl md:text-6xl font-bold text-[#0E4BA9]"
          >
            WeWIN Education
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="text-lg md:text-xl mt-6 text-gray-600 max-w-2xl mx-auto"
          >
            Hệ sinh thái giáo dục tiên phong trong kỹ năng, tiếng Anh và công nghệ.
            Chúng tôi tạo ra hành trình học tập hiện đại, thực tiễn và toàn diện 
            cho thế hệ trẻ Việt Nam.
          </motion.p>

          <motion.a
            href="#programs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.7 }}
            className="inline-block mt-10 px-10 py-4 rounded-xl text-white font-semibold 
              bg-linear-to-r from-[#0E4BA9] to-[#00a6fb] shadow-lg hover:scale-105 transition"
          >
            Khám phá chương trình
          </motion.a>
        </div>
      </section>

      {/* =========================
          ABOUT SECTION
      ========================== */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-[#0E4BA9] text-center">
            Tầm nhìn & Sứ mệnh
          </h2>

          <p className="text-lg text-gray-700 text-center max-w-3xl mx-auto mt-6 leading-relaxed">
            Với định hướng đổi mới giáo dục và ứng dụng công nghệ, 
            WeWIN Education tạo ra các chương trình học, hệ thống đánh giá, 
            nền tảng số và dự án trải nghiệm mang tính thực tiễn cao.  
            Mục tiêu của chúng tôi: giúp học sinh phát triển kỹ năng thật, 
            tư duy sáng tạo, và xây dựng nền tảng vững chắc cho tương lai.
          </p>
        </div>
      </section>

      {/* =========================
          PROGRAMS SECTION
      ========================== */}
      <section id="programs" className="py-24 bg-[#f5f8fc]">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-[#0E4BA9]">
            Chương trình của WeWIN Education
          </h2>

          <div className="grid md:grid-cols-3 gap-10 mt-14">
            {/* Kỹ năng */}
            <motion.div
              whileHover={{ scale: 1.03 }}
              className="bg-white rounded-2xl p-8 shadow-md border border-[#e8eef5]"
            >
              <div className="text-5xl mb-4">🎯</div>
              <h3 className="text-2xl font-bold text-[#0E4BA9]">
                Kỹ năng sống
              </h3>
              <p className="text-gray-700 mt-4 leading-relaxed">
                Phát triển tư duy phản biện, giải quyết vấn đề, 
                làm việc nhóm và giao tiếp hiệu quả.
              </p>
            </motion.div>

            {/* Tiếng Anh */}
            <motion.div
              whileHover={{ scale: 1.03 }}
              className="bg-white rounded-2xl p-8 shadow-md border border-[#e8eef5]"
            >
              <div className="text-5xl mb-4">🗣️</div>
              <h3 className="text-2xl font-bold text-[#0E4BA9]">
                Tiếng Anh
              </h3>
              <p className="text-gray-700 mt-4 leading-relaxed">
                Chương trình tiếng Anh giao tiếp thực tế, 
                tích hợp công nghệ và phương pháp học hiện đại.
              </p>
            </motion.div>

            {/* Công nghệ */}
            <motion.div
              whileHover={{ scale: 1.03 }}
              className="bg-white rounded-2xl p-8 shadow-md border border-[#e8eef5]"
            >
              <div className="text-5xl mb-4">💻</div>
              <h3 className="text-2xl font-bold text-[#0E4BA9]">
                Tư duy công nghệ
              </h3>
              <p className="text-gray-700 mt-4 leading-relaxed">
                Coding, robotics, STEM và các kỹ năng số 
                cần thiết cho thế kỷ 21.
              </p>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}