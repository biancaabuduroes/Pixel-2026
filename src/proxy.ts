import { NextResponse, type NextRequest } from "next/server";

// Next.js 16 "proxy" (formerly middleware) for "/":
// - first-time visitors see onboarding before home (cookie, decision 2026-11-07; must match
//   ONBOARDING_COOKIE in src/server/session.ts);
// - DEMO_MODE (decision 2026-11-08): every fresh entry to the app link starts onboarding again,
//   so each demo begins at the first screen.
export function proxy(request: NextRequest) {
  const firstVisit = !request.cookies.has("bd_onboarding_done");
  if (firstVisit || (process.env.DEMO_MODE === "true" && isFreshEntry(request))) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }
  return NextResponse.next();
}

/**
 * A full page load that didn't come from inside the app: the URL typed or pasted, a bookmark,
 * a link from another site, or the app loaded in an iframe (the /demo page). In-app moves to "/"
 * (finishing onboarding, login, the back button on a product) are client-side router requests
 * (RSC headers) or same-origin navigations, so they reach Home as usual.
 */
function isFreshEntry(request: NextRequest): boolean {
  const h = request.headers;
  if (h.has("rsc") || h.has("next-router-state-tree") || h.has("next-router-prefetch")) return false;
  if (h.get("sec-fetch-mode") !== "navigate") return false;
  const site = h.get("sec-fetch-site");
  return site === "none" || site === "cross-site" || h.get("sec-fetch-dest") === "iframe";
}

export const config = { matcher: "/" };
