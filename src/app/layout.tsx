import type { Metadata, Viewport } from "next";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
// Covers Mongolian Cyrillic (including Ө and Ү), which Poppins does not have
import "@fontsource-variable/montserrat/wght.css";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "LevelUp",
    template: "%s · LevelUp",
  },
  description: "7-р ангийн математикаа тоглоомоор нөх.",
};

export const viewport: Viewport = {
  themeColor: "#5b00ed",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="mn" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
