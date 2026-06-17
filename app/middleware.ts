import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/resources/:path*",
    "/tests/:path*",
    "/test/:path*",
    "/class/:path*",
    "/student/:path*",
    "/management/:path*",
  ],
};
