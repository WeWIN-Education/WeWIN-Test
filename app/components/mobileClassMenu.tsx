"use client";

import { useEffect, useRef } from "react";
import { Eye, Edit, Trash2, MoreVertical, AlertTriangle, Ban } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Class } from "@/app/constants/class";

interface MobileMenuProps {
  cls: Class;
  openMenu: string | null;
  setOpenMenu: (id: string | null) => void;
  handleViewClass: (cls: Class) => void;
  handleEditClass: (cls: Class) => void;
  handleCancelClass: (cls: Class) => void;
}

export default function MobileMenu({
  cls,
  openMenu,
  setOpenMenu,
  handleViewClass,
  handleEditClass,
  handleCancelClass,
}: MobileMenuProps) {
  const menuRef = useRef<HTMLDivElement | null>(null);

  // 🔹 Click ra ngoài để đóng menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setOpenMenu]);

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpenMenu(openMenu === cls.id ? null : cls.id);
        }}
        className="p-2 rounded-full hover:bg-blue-100 transition"
      >
        <MoreVertical size={18} className="text-[#0E4BA9]" />
      </button>

      <AnimatePresence>
        {openMenu === cls.id && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 bg-white border border-blue-100 rounded-lg shadow-lg w-32 z-20"
          >
            <button
              onClick={() => {
                handleViewClass(cls);
                setOpenMenu(null);
              }}
              className="flex items-center gap-2 px-3 py-2 w-full hover:bg-blue-50 text-blue-600"
            >
              <Eye size={16} /> View
            </button>
            <button
              onClick={() => {
                handleEditClass(cls);
                setOpenMenu(null);
              }}
              className="flex items-center gap-2 px-3 py-2 w-full hover:bg-yellow-50 text-yellow-600"
            >
              <Edit size={16} /> Edit
            </button>
            <button
              onClick={() => {
                handleCancelClass(cls);
                setOpenMenu(null);
              }}
              className="flex items-center gap-2 px-3 py-2 w-full hover:bg-orange-50 text-orange-600"
            >
              <Ban size={16} /> Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
