import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "sloty_session";

/** Paths that never require authentication */
const PUBLIC_PREFIXES = [
  "/login",
  "/signup",
  "/forgot",
  "/reset-password",
  "/verify-email",
  "/confirm-email-change",
  "/legal/",
  "/support",
  "/api/",
  "/admin",
  "/dev/",
];

function getSession(request: NextRequest) {
  const raw = request.cookies.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    const json = decodeURIComponent(atob(raw));
    const session = JSON.parse(json);
    if (!session || !session.userId || session.exp < Date.now()) return null;
    return session as { userId: string; email: string; role: string; profileComplete: boolean; exp: number };
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const session = getSession(request);

  // Root splash page: redirect to login if not authenticated
  if (pathname === "/") {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  // Onboarding paths: require auth but NOT profile completion
  if (pathname.startsWith("/onboarding/")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  // All other paths: require auth + profile completion
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If profile not complete and not a DEMO/MASTER user, force onboarding
  if (!session.profileComplete && session.role !== "DEMO" && session.role !== "MASTER") {
    return NextResponse.redirect(new URL("/onboarding/profile", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)$).*)",
  ],
};
