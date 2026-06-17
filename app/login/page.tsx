import { Suspense } from "react";
import { isGoogleAuthConfigured } from "../lib/googleAuth";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  const googleConfigured = isGoogleAuthConfigured();

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[calc(90vh-80px)]">
          <p className="text-[#0E4BA9]">Đang tải...</p>
        </div>
      }
    >
      <LoginForm googleConfigured={googleConfigured} />
    </Suspense>
  );
}
