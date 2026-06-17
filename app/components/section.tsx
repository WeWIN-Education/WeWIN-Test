"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import React from "react";

interface SectionItem {
  href: string;
  icon: React.ReactNode;
  label: string;
}

interface SectionProps {
  title: string;
  items: SectionItem[];
  setMenuOpen: (value: boolean) => void;
}

export default function Section({ title, items, setMenuOpen }: SectionProps) {
  return (
    <>
      <div className="relative text-sm font-bold tracking-widest text-white/80 uppercase pl-3 mt-4">
        <span className="relative z-10">{title}</span>
        <div className="absolute left-0 top-1/2 -translate-y-1/2 
                        w-1 h-4 bg-linear-to-b from-amber-400 to-yellow-300 
                        rounded-full shadow-sm" />
      </div>

      {items.map((item) => (
        <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-3 bg-linear-to-r from-[#0E4BA9]/80 to-[#00A6FB]/80 
                       rounded-xl px-5 py-4 text-white font-semibold shadow-md border border-white/20 
                       transition-all hover:shadow-lg hover:border-white/40"
          >
            <div className="w-8 h-8 flex items-center justify-center bg-white/20 rounded-full text-lg shadow-inner">
              {item.icon}
            </div>
            <div className="text-base font-bold">{item.label}</div>
          </motion.div>
        </Link>
      ))}
    </>
  );
}
