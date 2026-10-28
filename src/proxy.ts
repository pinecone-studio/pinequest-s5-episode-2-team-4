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
  const login = new URL("/login", request.url);
  // A student scanning a class QR comes back to it after logging in.
  if (pathname.startsWith("/join/")) login.searchParams.set("next", pathname);
  return NextResponse.redirect(login);
}

export const config = {
  // Skip Next's own files and anything with a file extension (pet sprites, favicon).
  matcher: ["/((?!_next/|.*\\.[^/]+$).*)"],
};
