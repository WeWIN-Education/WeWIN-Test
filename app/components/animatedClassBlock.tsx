"use client";

import { useEffect, useRef } from "react";
import {
  motion,
  easeOut,
  useAnimation,
  useInView,
} from "framer-motion";
import {
  BookOpen,
  Youtube,
  FileText,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { initialData } from "@/app/constants/class";

const fadeUp = {
  hidden: { opacity: 0, y: 25, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: easeOut },
  },
};

// 🔹 Icon Helper
const getIconByType = (type: string) => {
  const lower = type.toLowerCase();
  if (lower.includes("youtube"))
    return { icon: Youtube, bgColor: "bg-red-50", iconColor: "text-red-500" };
  if (lower.includes("pdf"))
    return {
      icon: FileText,
      bgColor: "bg-blue-50",
      iconColor: "text-blue-500",
    };
  if (lower.includes("drive") || lower.includes("docs"))
    return {
      icon: BookOpen,
      bgColor: "bg-green-50",
      iconColor: "text-green-500",
    };
  return {
    icon: FileText,
    bgColor: "bg-purple-50",
    iconColor: "text-purple-500",
  };
};

interface AnimatedClassBlockProps {
  cls: (typeof initialData)[number];
}

export default function AnimatedClassBlock({ cls }: AnimatedClassBlockProps) {
  const ref = useRef(null);
  const controls = useAnimation();

  // ✅ Framer hook để tự theo dõi xem component đang trong viewport không
  const isInView = useInView(ref, { amount: 0.15 });

  // ✅ Khi scroll vào viewport -> hiện, scroll ra -> ẩn
  useEffect(() => {
    if (isInView) controls.start("visible");
    else controls.start("hidden");
  }, [isInView, controls]);

  return (
    <motion.div
      ref={ref}
      variants={fadeUp}
      initial="hidden"
      animate={controls}
      className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
    >
      {/* 🔹 Class Header */}
      <div
        className="bg-linear-to-r from-[#c9e0ff] via-[#DCEBFF] to-[#c9e0ff]
                     text-[#0E4BA9] px-8 py-6 border-b border-[#B5D5FF]"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-[#0E4BA9]" />
              {cls.name}
            </h2>
            <span className="inline-block bg-[#0E4BA9]/10 px-3 py-1 rounded-full text-sm font-medium">
              📚 {cls.category}
            </span>
          </div>
          <div className="text-sm font-medium text-[#0E4BA9]">
            {cls.resources?.length || 0} tài liệu
          </div>
        </div>
      </div>

      {/* 🔹 Resource Cards */}
      <div className="p-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cls.resources && cls.resources.length > 0 ? (
          cls.resources.map((res) => {
            const { icon: Icon, bgColor, iconColor } = getIconByType(res.type);
            return (
              <motion.div
                key={res.id}
                variants={fadeUp}
                animate={controls}
                whileHover={{
                  y: -5,
                  scale: 1.02,
                  boxShadow: "0 8px 24px rgba(0, 166, 251, 0.2)",
                }}
                className="bg-white rounded-xl p-6 border-2 border-gray-200 
                           hover:border-[#3B82F6] transition-all duration-300 flex flex-col"
              >
                {/* Icon + Title */}
                <div className="flex items-start gap-3 mb-4">
                  <div className={`${bgColor} p-3 rounded-lg shrink-0`}>
                    <Icon className={`${iconColor} w-5 h-5`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-gray-900 leading-snug wrap-break-word">
                      {res.title}
                    </h3>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-5 leading-relaxed line-clamp-3 grow">
                  {res.description}
                </p>

                {/* Button */}
                <a
                  href={res.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group w-full inline-flex items-center justify-center gap-2 
                             text-sm font-semibold text-white bg-[#3B82F6] 
                             hover:bg-[#2563EB] py-3 px-4 rounded-lg transition-colors duration-200"
                >
                  Mở tài liệu
                  <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </a>
              </motion.div>
            );
          })
        ) : (
          <motion.div
            variants={fadeUp}
            animate={controls}
            className="text-center text-gray-500 italic py-4 col-span-full"
          >
            Chưa có tài liệu cho lớp này.
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
