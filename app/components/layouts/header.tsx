"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookMarked, FileText, LogIn, LogOut, Menu, UserRound, X } from "lucide-react";

import { Routes } from "@/app/constants/routes";
import { isAdminSession } from "@/app/lib/auth";

const TEST_LINKS = [
  {
    href: Routes.TEST_IELTS,
    label: "IELTS Test",
    icon: <FileText className="h-4 w-4" />,
  },
  {
    href: Routes.TEST_CAMBRIDGE,
    label: "Cambridge Test",
    icon: <BookMarked className="h-4 w-4" />,
  },
];

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showNavbar, setShowNavbar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const isAdmin = isAdminSession(session);

  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY;
      setShowNavbar(current < lastScrollY || current < 50);
      setLastScrollY(current);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <>
      <nav
        className={`fixed left-0 right-0 top-0 z-50 border-b border-white/20 bg-linear-to-r from-[#0E4BA9]/95 via-[#007BCE]/95 to-[#00A6FB]/95 shadow-md backdrop-blur-md transition-transform duration-200 ${
          showNavbar ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="mx-auto flex h-24 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
          <Logo />

          {session && (
            <div className="hidden items-center gap-2 lg:flex">
              {TEST_LINKS.map((item) => (
                <HeaderLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  active={pathname === item.href}
                />
              ))}
            </div>
          )}

          <div className="flex items-center gap-3">
            <UserSection session={session} isAdmin={isAdmin} />
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/15 text-white transition hover:bg-white/25 lg:hidden"
              aria-label="Toggle navigation"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-white/15 bg-[#087DCA] px-4 py-4 lg:hidden">
            <div className="space-y-2">
              {session &&
                TEST_LINKS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold transition ${
                      pathname === item.href
                        ? "bg-white text-[#0E4BA9]"
                        : "bg-white/10 text-white hover:bg-white/20"
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ))}

              {!session ? (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    signIn();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-bold text-[#0E4BA9]"
                >
                  <LogIn className="h-4 w-4" />
                  Đăng nhập
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    signOut({ callbackUrl: "/login" });
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#E4C28E] px-4 py-3 text-sm font-bold text-[#0E4BA9]"
                >
                  <LogOut className="h-4 w-4" />
                  Đăng xuất
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      <div className="h-24" />
    </>
  );
}

function Logo() {
  return (
    <Link href={Routes.HOME} className="flex min-w-0 items-center gap-3">
      <Image
        src="/logo.png"
        alt="WeWIN Education"
        width={200}
        height={120}
        priority
        className="h-auto w-36 drop-shadow-md sm:w-48"
      />
      <span className="hidden truncate text-2xl font-extrabold tracking-wide text-[#E4C28E] drop-shadow sm:block">
        WeWIN IELTS
      </span>
    </Link>
  );
}

function HeaderLink({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex h-11 items-center gap-2 rounded-lg px-4 text-sm font-bold transition ${
        active
          ? "bg-white text-[#0E4BA9] shadow-sm"
          : "bg-white/12 text-white hover:bg-white/20"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}

function UserSection({
  session,
  isAdmin,
}: {
  session: ReturnType<typeof useSession>["data"];
  isAdmin: boolean;
}) {
  if (!session) {
    return (
      <button
        type="button"
        onClick={() => signIn()}
        className="hidden h-11 items-center gap-2 rounded-lg bg-white px-4 text-sm font-bold text-[#0E4BA9] shadow-sm transition hover:bg-[#EAF4FF] lg:inline-flex"
      >
        <LogIn className="h-4 w-4" />
        Đăng nhập
      </button>
    );
  }

  return (
    <div className="hidden items-center gap-3 lg:flex">
      <div className="flex h-11 items-center gap-2 rounded-lg border border-white/20 bg-white/15 px-3 text-white">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E4C28E] text-sm font-extrabold text-[#0E4BA9]">
          {session.user?.name?.charAt(0).toUpperCase() || <UserRound className="h-4 w-4" />}
        </div>
        <div className="max-w-[160px] truncate text-sm font-semibold">
          {session.user?.name || session.user?.email}
          {isAdmin && <span className="ml-1 text-[#F4E3C8]">(Admin)</span>}
        </div>
      </div>

      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#E4C28E] px-4 text-sm font-bold text-[#0E4BA9] shadow-sm transition hover:bg-[#F0D09A]"
      >
        <LogOut className="h-4 w-4" />
        Đăng xuất
      </button>
    </div>
  );
}
