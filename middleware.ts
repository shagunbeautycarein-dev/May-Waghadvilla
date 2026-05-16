import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect admin routes
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const adminToken = request.cookies.get("admin_session")?.value;
    if (!adminToken) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  // Protect guest routes — allow Supabase auth OR custom guest_session cookie
  if (pathname.startsWith("/guest") && !pathname.startsWith("/guest/login")) {
    const hasSupabaseCookie = request.cookies
      .getAll()
      .some((c) => c.name.startsWith("sb-"));
    const hasGuestSession = request.cookies.get("guest_session")?.value;
    if (!hasSupabaseCookie && !hasGuestSession) {
      return NextResponse.redirect(new URL("/guest/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/guest/:path*"],
};
