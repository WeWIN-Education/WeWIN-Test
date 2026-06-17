"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import React from "react";

interface DropdownItem {
  href?: string;
  label: string;
  children?: DropdownItem[];
}

interface DropdownProps {
  title: string;
  icon?: React.ReactNode;
  items: DropdownItem[];
}

export default function Dropdown({ title, icon, items }: DropdownProps) {
  return (
    <div className="relative group">
      {/* 🔹 Main button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/95 text-[#0E4BA9] 
                   font-bold shadow-lg border border-white/50 transition-all duration-300"
        style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
      >
        {icon}
        <span>{title}</span>
        <svg
          className="w-3.5 h-3.5 transition-transform duration-300 group-hover:rotate-180"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </motion.button>

      {/* 🔹 First-level dropdown */}
      <motion.div
        initial={{ opacity: 0, y: -15, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="absolute left-0 mt-1 w-56 bg-white/95 rounded-xl shadow-xl border border-blue-100 
                   opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all 
                   duration-300 overflow-hidden z-50 backdrop-blur-md"
        style={{
          boxShadow:
            "0 8px 24px rgba(14,75,169,0.15), 0 0 12px rgba(0,166,251,0.15)",
        }}
      >
        {items.map((item) => (
          <div key={item.label} className="relative group/item">
            {/* Item chính */}
            {item.href ? (
              <Link
                href={item.href}
                className="block px-5 py-3 text-[#0E4BA9] font-semibold border-b border-blue-50 
                           last:border-0 hover:bg-[#E6F4FF]"
              >
                {item.label}
              </Link>
            ) : (
              <div className="flex justify-between items-center px-5 py-3 text-[#0E4BA9] 
                              font-semibold border-b border-blue-50 last:border-0 hover:bg-[#E6F4FF] 
                              cursor-default">
                <span>{item.label}</span>
                {item.children && (
                  <svg
                    className="w-3.5 h-3.5 text-[#0E4BA9]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>
            )}

            {/* 🔹 Submenu (second-level) */}
            {item.children && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute top-0 left-full ml-2 w-52 bg-white/95 rounded-xl shadow-lg 
                           border border-blue-100 opacity-0 invisible 
                           group-hover/item:opacity-100 group-hover/item:visible 
                           transition-all duration-300 z-50 backdrop-blur-md"
              >
                {item.children.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href!}
                    className="block px-5 py-3 text-[#0E4BA9] font-semibold border-b border-blue-50 
                               last:border-0 hover:bg-[#E6F4FF]"
                  >
                    {child.label}
                  </Link>
                ))}
              </motion.div>
            )}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
