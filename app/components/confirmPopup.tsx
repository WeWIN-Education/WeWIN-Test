"use client";
import { motion } from "framer-motion";

interface ConfirmPopupProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  description?: string;
}

export default function ConfirmPopup({
  visible,
  onConfirm,
  onCancel,
  title = "Bạn có chắc?",
  description = "Hành động này không thể hoàn tác.",
}: ConfirmPopupProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl p-7 w-[90%] max-w-sm text-center shadow-xl"
      >
        <h3 className="text-xl font-bold text-[#0E4BA9] mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{description}</p>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-100 transition"
          >
            Hủy
          </button>

          <button
            onClick={onConfirm}
            className="px-5 py-2.5 rounded-xl bg-linear-to-r from-red-500 to-red-600 text-white font-semibold shadow hover:opacity-90 transition"
          >
            Xác nhận
          </button>
        </div>
      </motion.div>
    </div>
  );
}
