import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Entrar — Weight Tracker" };

export default function LoginPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
