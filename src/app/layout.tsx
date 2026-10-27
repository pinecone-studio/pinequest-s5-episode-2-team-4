import type { Metadata } from "next";
import Script from "next/script";
import { Montserrat, Poppins } from "next/font/google";
import { Suspense } from "react";
import { PageLoading } from "@/components/PageLoading";
import { ThemeToggle } from "@/components/ThemeToggle";
import "./globals.css";
import "./theme.css";

// Poppins has no Cyrillic, so Mongolian text falls back to Montserrat.
// ө and ү live in the cyrillic-ext subset.
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "LevelUp",
  description: "Ойлгоогүйгээ ичихгүйгээр нөх.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="mn"
      suppressHydrationWarning
      className={`${poppins.variable} ${montserrat.variable} h-full antialiased`}
    >
      {/* Pages read the session cookie, which streams in at request time. */}
      <body className="min-h-full flex flex-col">
        <Script id="levelup-theme" strategy="beforeInteractive">
          {`try{var theme=localStorage.getItem('levelup-theme');document.documentElement.dataset.theme=theme==='dark'?'dark':'light'}catch{}`}
        </Script>
        <Suspense fallback={<PageLoading />}>{children}</Suspense>
        <ThemeToggle />
      </body>
    </html>
  );
}
