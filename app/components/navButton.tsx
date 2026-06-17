"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import React from "react";

interface NavButtonProps {
  title: string;
  icon?: React.ReactNode;
  href: string;
}

export default function NavButton({ title, icon, href }: NavButtonProps) {
  return (
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
      <Link
        href={href}
        className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/95 
                   text-[#0E4BA9] font-bold shadow-lg border border-white/50 
                   transition-all duration-300 hover:bg-[#E6F4FF]"
        style={{
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}
      >
        {icon}
        <span>{title}</span>
      </Link>
    </motion.div>
  );
}
