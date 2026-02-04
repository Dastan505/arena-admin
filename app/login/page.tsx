import { Suspense } from "react";
import LoginClient from "./login-client";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-300">
          Загрузка...
        </div>
      }
    >
      <LoginClient />
    </Suspense>
  );
}
