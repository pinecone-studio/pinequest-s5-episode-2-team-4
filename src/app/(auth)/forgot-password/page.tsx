import type { Metadata } from "next";
import { ForgotForm } from "./ForgotForm";

export const metadata: Metadata = {
  title: "Нууц үг сэргээх · LevelUp",
};

export default function ForgotPasswordPage() {
  return (
    <main className="relative flex flex-1 items-center justify-center px-4 pt-6 pb-16">
      <ForgotForm />
    </main>
  );
}
