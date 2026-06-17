import { Session } from "next-auth";
import { allowedEmails } from "@/app/constants/email";
import { Routes } from "@/app/constants/routes";

export function isAdminSession(
  session: Session | null | undefined
): boolean {
  if (!session?.user) return false;
  if (session.user.role === "admin") return true;
  if (!session.user.email) return false;
  return allowedEmails.includes(session.user.email);
}

export function getPostLoginRoute(
  session: Session | null | undefined
): string {
  return isAdminSession(session) ? Routes.MANAGE_CLASS : Routes.TEST_IELTS;
}
