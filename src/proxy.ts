import { NextResponse, type NextRequest } from "next/server";

// Next.js 16 "proxy" (formerly middleware): first-time visitors see onboarding before home.
// Completion is remembered in a cookie only (decision 2026-11-07). Must match ONBOARDING_COOKIE
// in src/server/session.ts.
export function proxy(request: NextRequest) {
  if (!request.cookies.has("bd_onboarding_done")) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: "/" };
