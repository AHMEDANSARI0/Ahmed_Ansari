import { NextResponse, type NextRequest } from "next/server";
import { CSRF_COOKIE, createCsrfToken } from "@/lib/security/csrf";

const SESSION_COOKIE = "aa_session";
const PUBLIC_ADMIN_PATHS = ["/admin/login"];

function withCsrf(request: NextRequest, response: NextResponse) {
  if (!request.cookies.get(CSRF_COOKIE)?.value) {
    response.cookies.set(CSRF_COOKIE, createCsrfToken(), {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 4,
    });
  }
  return response;
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isPublic = PUBLIC_ADMIN_PATHS.includes(pathname);
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  if (!hasSession && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return withCsrf(request, NextResponse.redirect(url));
  }

  if (hasSession && isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/dashboard";
    url.search = "";
    return withCsrf(request, NextResponse.redirect(url));
  }

  return withCsrf(request, NextResponse.next());
}

export const config = {
  matcher: ["/admin/:path*"],
};
