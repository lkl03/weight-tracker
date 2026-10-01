import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_NAME, isPublicPath, verifySession } from "@/lib/auth";

// Next 16: `middleware` is now `proxy`. Everything except the login flow,
// the Telegram webhook and the cron job requires the session cookie.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isPublicPath(pathname)) return NextResponse.next();

  if (await verifySession(request.cookies.get(COOKIE_NAME)?.value)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL("/login", request.url);
  if (pathname !== "/") url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\.(?:png|svg|jpg|webp|ico)$).*)"],
};
