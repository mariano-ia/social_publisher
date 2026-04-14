import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "sp_auth";
const PUBLIC_PATHS = ["/login", "/api/login", "/_next", "/favicon", "/brand"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token || token !== expectedToken()) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

function expectedToken(): string {
  // The token is a derived hash of the password. Computed at request time
  // so changing APP_PASSWORD invalidates all sessions.
  const pwd = process.env.APP_PASSWORD ?? "";
  return Buffer.from(`sp:${pwd}`).toString("base64");
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand).*)"],
};
