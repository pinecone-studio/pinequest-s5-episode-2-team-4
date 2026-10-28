import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

/** Pages a logged-out visitor may open. */
const PUBLIC_PATHS = ["/login", "/signup", "/forgot-password", "/reset-password"];

/** Sends visitors without a session to /login. Pages still check the session itself. */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_PATHS.includes(pathname) || request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.next();
  }
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  // Skip Next's own files and anything with a file extension (pet sprites, favicon).
  matcher: ["/((?!_next/|.*\\.[^/]+$).*)"],
};
