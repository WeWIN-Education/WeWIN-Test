"use client";

import type React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  GraduationCap,
  Mic,
  PanelLeftClose,
  PanelLeftOpen,
  Users,
} from "lucide-react";
import { useState } from "react";

import { Routes } from "@/app/constants/routes";

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string) => pathname === href;

  return (
    <div
      className={`flex h-full flex-col overflow-hidden bg-linear-to-br from-[#0B4BA8] via-[#1565C0] to-[#1976D2] text-white shadow-2xl transition-all duration-200 ${
        collapsed ? "w-20" : "w-72"
      }`}
    >
      <div className="flex items-center gap-3 border-b border-white/10 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15">
          <GraduationCap className="h-6 w-6 text-white" />
        </div>
        {!collapsed && (
          <div>
            <h2 className="text-sm font-semibold text-white">Admin Panel</h2>
            <p className="text-xs text-white/65">Test Management</p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto p-3">
        <SidebarLink
          href={Routes.MANAGE_CLASS}
          label="IELTS Results"
          icon={<ClipboardList className="h-4 w-4" />}
          active={isActive(Routes.MANAGE_CLASS)}
          collapsed={collapsed}
        />
        <SidebarLink
          href={Routes.MANAGE_CAMBRIDGE}
          label="Cambridge Results"
          icon={<Mic className="h-4 w-4" />}
          active={isActive(Routes.MANAGE_CAMBRIDGE)}
          collapsed={collapsed}
        />
        <SidebarLink
          href={Routes.MANAGE_STUDENT}
          label="Students"
          icon={<Users className="h-4 w-4" />}
          active={isActive(Routes.MANAGE_STUDENT)}
          collapsed={collapsed}
        />
      </nav>

      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-white/10 py-2.5 text-sm font-semibold transition hover:bg-white/20"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <>
              <PanelLeftClose className="h-4 w-4" />
              <span>Thu gọn</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function SidebarLink({
  href,
  label,
  icon,
  active,
  collapsed,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  collapsed?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition ${
        active ? "bg-white/25 shadow-sm" : "hover:bg-white/10"
      }`}
    >
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-lg ${
          active ? "bg-white/25" : "bg-white/10"
        }`}
      >
        {icon}
      </div>
      {!collapsed && (
        <span className={active ? "font-bold text-white" : "font-semibold text-white/90"}>
          {label}
        </span>
      )}
    </Link>
  );
}
