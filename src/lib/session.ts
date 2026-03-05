/**
 * Cookie-based session management for SLOTY.
 * Works in both DEMO_MODE (client-side) and production (server-side).
 */

const COOKIE_NAME = "sloty_session";
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export type SessionRole = "USER" | "ADMIN" | "DEMO" | "MASTER";

export type SessionData = {
  userId: string;
  email: string;
  role: SessionRole;
  profileComplete: boolean;
  exp: number;
};

// --- Client-side (browser) ---

/** Set session cookie from client */
export function setSessionCookie(data: Omit<SessionData, "exp">) {
  const session: SessionData = { ...data, exp: Date.now() + SESSION_DURATION_MS };
  const json = JSON.stringify(session);
  // encodeURIComponent handles non-ASCII chars before btoa
  const encoded = btoa(encodeURIComponent(json));
  document.cookie = `${COOKIE_NAME}=${encoded}; path=/; max-age=${Math.floor(SESSION_DURATION_MS / 1000)}; samesite=lax`;
}

/** Get current session from cookie (client-side) */
export function getClientSession(): SessionData | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]+)`));
  if (!match) return null;
  return decodeSessionValue(match[1]);
}

/** Clear session cookie */
export function clearSessionCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
}

/** Update profileComplete flag in existing session */
export function updateSessionProfile(complete: boolean) {
  const session = getClientSession();
  if (!session) return;
  setSessionCookie({ ...session, profileComplete: complete });
}

// --- Shared (used by middleware / server) ---

/** Parse session from raw cookie value */
export function decodeSessionValue(value: string | undefined): SessionData | null {
  if (!value) return null;
  try {
    const json = decodeURIComponent(atob(value));
    const session = JSON.parse(json) as SessionData;
    if (!session || !session.userId || session.exp < Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
