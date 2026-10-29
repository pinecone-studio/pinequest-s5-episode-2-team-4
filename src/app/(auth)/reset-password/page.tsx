import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui";
import { getPasswordResetUsername } from "@/lib/data";
import { ResetForm } from "./ResetForm";

export const metadata: Metadata = {
  title: "Шинэ нууц үг · LevelUp",
  // The link's token is in the URL: don't send it to other sites.
  referrer: "no-referrer",
};

export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  const { token } = await searchParams;
  const username = typeof token === "string" ? await getPasswordResetUsername(token) : undefined;

  return (
    <main className="relative flex flex-1 items-center justify-center px-4 pt-6 pb-16">
      <section
        aria-labelledby="reset-title"
        className="w-full max-w-115 rounded-panel bg-white px-6 py-8 shadow-float md:px-10 md:py-9"
      >
        {username && typeof token === "string" ? (
          <>
            <h1 id="reset-title" className="text-center text-3xl leading-tight font-bold">
              Шинэ нууц үг
            </h1>
            <p className="mt-3 text-center text-ink-muted">
              <span className="font-bold text-ink">{username}</span>, шинэ нууц үгээ оруулаарай.
            </p>
            <ResetForm token={token} />
          </>
        ) : (
          <>
            <h1 id="reset-title" className="text-center text-3xl leading-tight font-bold">
              Холбоос хүчингүй
            </h1>
            <p className="mt-3 text-center text-ink-muted">
              Энэ холбоосын хугацаа дууссан эсвэл аль хэдийн ашиглагдсан байна.
            </p>
            <ButtonLink href="/forgot-password" size="lg" className="mt-6 w-full">
              Шинэ холбоос авах
            </ButtonLink>
          </>
        )}
      </section>
    </main>
  );
}
