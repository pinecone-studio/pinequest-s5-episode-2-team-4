import type { Metadata } from "next";
import Script from "next/script";
import { Nunito } from "next/font/google";
import { Suspense } from "react";
import { PageLoading } from "@/components/PageLoading";
import { ThemeToggle } from "@/components/ThemeToggle";
import "./globals.css";
import "./theme.css";

// One family for Latin, digits and Cyrillic, so a line never mixes two fonts.
// ө and ү live in the cyrillic-ext subset.
const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
});

export const metadata: Metadata = {
  title: "LevelUp",
  description: "Ойлгоогүйгээ өөрийн хурдаар нөх.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="mn"
      suppressHydrationWarning
      className={`${nunito.variable} h-full antialiased`}
    >
      {/* Pages read the session cookie, which streams in at request time. */}
      <body className="min-h-full flex flex-col">
        <Script id="levelup-theme" strategy="beforeInteractive">
          {`try{var theme=localStorage.getItem('levelup-theme');document.documentElement.dataset.theme=theme==='dark'?'dark':'light'}catch{}`}
        </Script>
        <Suspense fallback={<PageLoading />}>{children}</Suspense>
        {/* The toggle reads the URL (it hides on battle screens), so it streams too. */}
        <Suspense fallback={null}>
          <ThemeToggle />
        </Suspense>
      </body>
    </html>
  );
}
