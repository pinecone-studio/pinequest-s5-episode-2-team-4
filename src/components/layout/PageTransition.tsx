"use client";

import { usePathname } from "next/navigation";
import { ViewTransition } from "react";

/**
 * Wraps a layout's page: on navigation the old page fades out and the new one
 * fades in and rises a little (CSS in globals.css). Keyed by path, so changing
 * only the query (e.g. ?sub=) swaps content without the page animation.
 */
export function PageTransition({ children, className }: { children: React.ReactNode; className?: string }) {
  const pathname = usePathname();
  return (
    <ViewTransition key={pathname} enter="page-in" exit="page-out" default="none">
      {/* One element for the browser to snapshot */}
      <div className={className}>{children}</div>
    </ViewTransition>
  );
}
