import NextAuth from "next-auth";
import { authOptions } from "../authOptions";
import { signOut } from "next-auth/react";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

export const handleLogout = () => {
  signOut();
};
