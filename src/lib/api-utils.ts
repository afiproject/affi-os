import { NextResponse } from "next/server";
import { auth } from "./auth";
import type { ApiError } from "@/types";

/**
 * 認証済みセッションを取得。未認証の場合は401レスポンスを返す
 */
export async function getAuthenticatedSession() {
  const session = await auth();
  if (!session?.user?.id) {
    return { session: null, errorResponse: unauthorized() };
  }
  return { session, errorResponse: null };
}

export function success<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function errorResponse(error: ApiError, status: number) {
  return NextResponse.json({ error }, { status });
}

export function unauthorized() {
  return errorResponse(
    { code: "UNAUTHORIZED", message: "認証が必要です" },
    401
  );
}

export function forbidden() {
  return errorResponse(
    { code: "FORBIDDEN", message: "権限がありません" },
    403
  );
}

export function notFound(message = "リソースが見つかりません") {
  return errorResponse({ code: "NOT_FOUND", message }, 404);
}

export function conflict(message: string, details?: Record<string, unknown>) {
  return errorResponse({ code: "CONFLICT_DETECTED", message, details }, 409);
}

export function insufficientTickets() {
  return errorResponse(
    { code: "INSUFFICIENT_TICKETS", message: "チケットが不足しています" },
    422
  );
}

export function rateLimited() {
  return errorResponse(
    { code: "RATE_LIMITED", message: "リクエスト回数の上限に達しました" },
    429
  );
}

export function badRequest(message: string) {
  return errorResponse({ code: "INVALID_REQUEST", message }, 400);
}
