/**
 * Server-side auth service.
 * Used by API routes when DATABASE_URL is available.
 * Falls back gracefully when no DB is connected.
 */
import { randomBytes, createHash } from "crypto";
import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 12;

/** Hash a password with bcrypt */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/** Verify a password against a bcrypt hash */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Generate a secure random token */
export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

/** Hash a token for storage (SHA-256) */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Check if Prisma/DB is available */
export function isDbAvailable(): boolean {
  return !!process.env.DATABASE_URL;
}

/** Get the app origin for email links */
export function getAppOrigin(): string {
  return process.env.APP_ORIGIN || process.env.NEXTAUTH_URL || "http://localhost:3000";
}
