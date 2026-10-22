import type { Metadata } from "next";
import { Montserrat, Poppins } from "next/font/google";
import { Suspense } from "react";
import { PageLoading } from "@/components/PageLoading";
import "./globals.css";

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
      className={`${poppins.variable} ${montserrat.variable} h-full antialiased`}
    >
      {/* Pages read the session cookie, which streams in at request time. */}
      <body className="min-h-full flex flex-col">
        <Suspense fallback={<PageLoading />}>{children}</Suspense>
      </body>
    </html>
  );
}
