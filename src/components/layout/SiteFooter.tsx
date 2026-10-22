import { Logo } from "./Logo";

/** Pet sprites are from Tuxemon; this attribution is required by CC BY-SA 4.0. */
export function TuxemonCredit() {
  return (
    <span>
      Зураг:{" "}
      <a
        href="https://wiki.tuxemon.org/Completed_Tuxemon"
        className="text-sky hover:text-white"
      >
        Tuxemon
      </a>{" "}
      ·{" "}
      <a
        href="https://creativecommons.org/licenses/by-sa/4.0/"
        className="text-sky hover:text-white"
      >
        CC BY-SA 4.0
      </a>
    </span>
  );
}

type SiteFooterProps = {
  /** Auth pages show the copyright instead of the logo. */
  variant?: "default" | "auth";
};

export function SiteFooter({ variant = "default" }: SiteFooterProps) {
  return (
    <footer className="bg-black text-[13px] text-lavender">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-5 md:px-[clamp(16px,4vw,40px)]">
        {variant === "auth" ? (
          <span>© 2026 LevelUp баг</span>
        ) : (
          <Logo tone="light" size="sm" />
        )}
        <TuxemonCredit />
      </div>
    </footer>
  );
}
