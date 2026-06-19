import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[calc(90vh-80px)]">
          <p className="text-[#0E4BA9]">Đang tải...</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
