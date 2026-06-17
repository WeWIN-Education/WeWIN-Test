import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { isAdminSession } from "@/app/lib/auth";
import { authOptions } from "../api/auth/authOptions";

export default async function ManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");

  if (!isAdminSession(session)) redirect("/login");

  // ✅ Nếu là admin → hiển thị nội dung
  return <>{children}</>;
}
