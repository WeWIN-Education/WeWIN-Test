"use client";

import { useSession } from "next-auth/react";
import Navbar from "./layouts/header";
import Sidebar from "./layouts/sidebar";
import Footer from "./layouts/footer";
import { isAdminSession } from "../lib/auth";

export default function ProvidersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const isAdmin = isAdminSession(session);

  return (
    <>
      {/* 🧭 Navbar */}
      <Navbar />

      {/* 🧩 Main Area */}
      <div className="flex flex-1 w-full overflow-hidden">
        {isAdmin && (
          <aside
            className="hidden md:flex text-white shadow-lg flex-col justify-between"
          >
            <Sidebar />
          </aside>
        )}

        <main className="flex-1">{children}</main>
      </div>

      {/* ⚓ Footer */}
      <Footer />
    </>
  );
}
