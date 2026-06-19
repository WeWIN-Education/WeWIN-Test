"use client";

import { signIn, useSession } from "next-auth/react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { getPostLoginRoute } from "../lib/auth";

export default function LoginForm() {
  const { data: session, status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      redirectedRef.current = false;
      return;
    }

    if (status !== "authenticated" || !session?.user || redirectedRef.current) {
      return;
    }

    redirectedRef.current = true;
    window.location.replace(getPostLoginRoute(session));
  }, [status, session]);

  const handleCredentialsLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setLoading(false);
      setError("Email hoac mat khau khong dung.");
      return;
    }

    const sessionRes = await fetch("/api/auth/session");
    const freshSession = await sessionRes.json();

    if (!freshSession?.user) {
      setLoading(false);
      setError("Khong the xac thuc phien dang nhap. Vui long thu lai.");
      return;
    }

    window.location.replace(getPostLoginRoute(freshSession));
  };

  if (status === "authenticated") {
    return (
      <div className="flex min-h-[calc(90vh-80px)] flex-col items-center justify-center bg-linear-to-b from-[#EAF4FF] to-[#F9FAFB] font-[Lexend]">
        <motion.img
          src="/logo.png"
          alt="WeWIN Logo"
          className="mb-6 w-28 drop-shadow-lg"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        />
        <p className="animate-pulse text-lg font-medium text-[#0E4BA9]">
          Dang chuyen huong...
        </p>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-[calc(90vh-80px)] flex-col items-center justify-center bg-linear-to-b from-[#EAF4FF] to-[#F9FAFB] font-[Lexend]">
        <motion.img
          src="/logo.png"
          alt="WeWIN Logo"
          className="mb-6 w-28 drop-shadow-lg"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        />
        <p className="animate-pulse text-lg font-medium text-[#0E4BA9]">
          Dang kiem tra dang nhap...
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(90vh-80px)] flex-col items-center justify-center bg-linear-to-b from-[#EAF4FF] to-[#F9FAFB] px-4 font-[Lexend]">
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-lg rounded-[32px] border-t-4 border-[#0E4BA9] bg-white px-8 py-12 text-center shadow-2xl sm:px-14"
      >
        <motion.img
          src="/logo.png"
          alt="WeWIN Logo"
          className="mx-auto mb-8 w-40 drop-shadow-lg"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        />
        <h1 className="mb-2 text-3xl font-bold text-[#0E4BA9]">
          Welcome to <span className="text-[#00A6FB]">WeWIN IELTS</span>
        </h1>
        <p className="mb-8 text-base leading-relaxed text-gray-600">
          Dang nhap bang email va mat khau.
        </p>

        {error && (
          <p className="mb-4 text-center text-sm text-red-500">{error}</p>
        )}

        <form onSubmit={handleCredentialsLogin} className="space-y-4 text-left">
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="admin@wewin.edu.vn"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#0E4BA9] focus:ring-2 focus:ring-[#0E4BA9]/20"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Mat khau
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="Password"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#0E4BA9] focus:ring-2 focus:ring-[#0E4BA9]/20"
            />
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            className="w-full rounded-full bg-linear-to-r from-[#0E4BA9] to-[#00A6FB] py-4 text-lg font-medium text-white shadow-lg transition-all hover:brightness-110 disabled:opacity-60"
          >
            {loading ? "Dang dang nhap..." : "Dang nhap"}
          </motion.button>
        </form>
      </motion.div>

      <p className="mt-8 text-sm text-gray-400">
        (c) {new Date().getFullYear()} <b>WeWIN Education</b>. All Rights
        Reserved.
      </p>
    </div>
  );
}
