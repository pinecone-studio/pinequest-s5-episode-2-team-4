import type { Metadata } from "next";
import Link from "next/link";
import { LandscapeBackdrop } from "@/components/layout/LandscapeBackdrop";
import { Logo } from "@/components/layout/Logo";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "Үнийн санал · LevelUp",
};

const plans = [
  {
    name: "BASIC",
    price: "0₮",
    unit: "",
    features: ["Багшийн хичээл, AI reel", "Тоглоомон даалгавар, XP", "Нэрээ нууж асуух", "Тэжээвэр"],
  },
  {
    name: "STANDARD",
    price: "9,900₮",
    unit: "/сар",
    features: ["Бие даан давтах", "Хичээл, ангиа өөрөө сонгох", "Хязгааргүй дасгал, тоглоом", "Өөрийн ахицын самбар"],
    featured: true,
  },
  {
    name: "АНГИЙН БАГЦ",
    price: "99,000₮",
    unit: "/анги/сар",
    features: ["Багшийн самбар", "Ойлголтын дохио", "35 хүртэл сурагч", "Сурагч бүрт ≈2,800₮"],
  },
];

/** Plans and prices as plain text; there is no payment yet. */
export default function PricingPage() {
  return (
    <>
      <LandscapeBackdrop />
      <header className="mx-auto flex h-18 w-full max-w-7xl items-center px-4 md:h-22 md:px-[clamp(16px,4vw,40px)]">
        <Link href="/" aria-label="LevelUp" className="no-underline">
          <Logo />
        </Link>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-4 pb-16 md:px-[clamp(16px,4vw,40px)] md:pt-8">
        <p className="text-center text-lg text-ink-muted">Үнийн санал</p>
        <h1 className="type-page-title text-center">PRICING</h1>

        <ul className="mt-8 grid gap-4 md:mt-12 md:grid-cols-3 md:gap-6">
          {plans.map((plan) => (
            <li
              key={plan.name}
              className={cn(
                "rounded-panel border-2 p-6 shadow-card md:p-8",
                plan.featured ? "border-primary bg-surface" : "border-transparent bg-card",
              )}
            >
              <h2 className="text-xl font-bold md:text-2xl">{plan.name}</h2>
              <p className="mt-3 text-4xl font-bold md:text-5xl">
                {plan.price}
                {plan.unit ? <span className="ml-1.5 text-base font-semibold text-ink-muted">{plan.unit}</span> : null}
              </p>
              <ul className="mt-6 flex flex-col gap-3 border-t border-line pt-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-ink-muted">
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary">
                      <path d="m5 12 5 5 9-10" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>

        <p className="mx-auto mt-10 max-w-xl text-center text-lg font-semibold md:text-xl">
          LEVELUP STANDARD жилд ≈119,000₮, давтлагад зарцуулах мөнгөнөөс 13 дахин хямд.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
