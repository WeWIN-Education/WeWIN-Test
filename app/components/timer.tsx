"use client";

import { useEffect, useRef, useState } from "react";

export default function Timer({
  minutes,
  onTimeout,
}: {
  minutes: number;
  onTimeout: () => void;
}) {
  const [, forceRender] = useState({});
  const totalSeconds = minutes * 60;

  // 🔥 Tính startAt ngay tại đây (không dùng function trong useRef)
  const saved = typeof window !== "undefined"
    ? localStorage.getItem("ielts_startAt")
    : null;

  const initialStartAt = saved ? Number(saved) : Date.now();

  // 🔥 sửa ở đây: dùng startAt số, không dùng function
  const startAtRef = useRef<number>(initialStartAt);

  // Nếu chưa có localStorage thì lưu vào
  if (!saved && typeof window !== "undefined") {
    localStorage.setItem("ielts_startAt", String(initialStartAt));
  }

  const getTimeLeft = () => {
    const now = Date.now();
    const elapsed = Math.floor((now - startAtRef.current) / 1000);
    return totalSeconds - elapsed;
  };

  const timeLeftRef = useRef<number>(getTimeLeft());

  useEffect(() => {
    const interval = setInterval(() => {
      timeLeftRef.current = getTimeLeft();

      if (timeLeftRef.current <= 0) {
        clearInterval(interval);
        onTimeout();
      }

      forceRender({});
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const t = timeLeftRef.current;
  const m = String(Math.floor(t / 60)).padStart(2, "0");
  const s = String(t % 60).padStart(2, "0");

  return (
    <div className="
      fixed top-20 right-4 z-50
      bg-white border border-[#0E4BA9]/40 text-[#0E4BA9]
      px-4 py-2 rounded-xl font-bold shadow
    ">
      ⏳ {m}:{s}
    </div>
  );
}
