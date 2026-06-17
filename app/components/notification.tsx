"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface NotificationProps {
  message: string;
  type?: "info" | "success" | "error";
  visible: boolean;
  onClose: () => void;
}

export default function Notification({
  message,
  type = "info",
  visible,
  onClose,
}: NotificationProps) {
  // Tự động tắt sau 3 giây
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  const bgColors = {
    info: "bg-blue-500",
    success: "bg-green-500",
    error: "bg-red-500",
  };

  return (
    <div className="fixed top-5 right-5 z-9999">
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: 30 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -20, x: 30 }}
            transition={{ duration: 0.3 }}
            className={`flex items-center gap-3 text-white ${bgColors[type]} shadow-lg rounded-xl px-5 py-4 w-auto max-w-[90vw] whitespace-nowrap`}
          >
            <div className="flex-1 text-sm leading-relaxed">{message}</div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white text-lg font-semibold"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
