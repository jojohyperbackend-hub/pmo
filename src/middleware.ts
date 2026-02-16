import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // hanya protect planner
  if (!pathname.startsWith("/planner")) {
    return NextResponse.next();
  }

  const authCookie = request.cookies.get("pmo_auth");

  if (!authCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/planner/:path*"],
};
