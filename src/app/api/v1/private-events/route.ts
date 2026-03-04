import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { handlePrivateEventConflicts } from "@/lib/conflicts";
import {
  getAuthenticatedSession,
  success,
  badRequest,
} from "@/lib/api-utils";
import { z } from "zod";

// 非公開予定一覧
export async function GET(req: NextRequest) {
  const { session, errorResponse } = await getAuthenticatedSession();
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");

  const where: Record<string, unknown> = {
    userId: session!.user.id,
  };

  if (startDate) {
    where.startAt = { gte: new Date(startDate) };
  }
  if (endDate) {
    where.endAt = { ...(where.endAt as object ?? {}), lte: new Date(endDate) };
  }

  const events = await prisma.privateEvent.findMany({
    where: where as never,
    orderBy: { startAt: "asc" },
  });

  return success({ events });
}

// 非公開予定追加（衝突チェック含む）
const createEventSchema = z.object({
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  title: z.string().max(100).optional(),
  visibilityToFriends: z.enum(["busy_only", "title", "detail", "hidden"]).default("busy_only"),
});

export async function POST(req: NextRequest) {
  const { session, errorResponse } = await getAuthenticatedSession();
  if (errorResponse) return errorResponse;

  const body = await req.json();
  const parsed = createEventSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0].message);
  }

  const data = parsed.data;
  const startAt = new Date(data.startAt);
  const endAt = new Date(data.endAt);

  if (endAt <= startAt) {
    return badRequest("終了時刻は開始時刻より後にしてください");
  }

  // 非公開予定を作成
  const event = await prisma.privateEvent.create({
    data: {
      userId: session!.user.id,
      startAt,
      endAt,
      title: data.title ?? null,
      visibilityToFriends: data.visibilityToFriends,
      source: "manual",
    },
  });

  // 既存スロットとの衝突チェック → 自動PAUSE + 警告
  const conflicts = await handlePrivateEventConflicts(session!.user.id, {
    startAt,
    endAt,
  });

  // TODO: pausedSlots に対して通知を送信
  // TODO: warningSlots に対して警告通知を送信

  return success({
    event,
    conflicts: {
      pausedSlots: conflicts.pausedSlots,
      warningSlots: conflicts.warningSlots,
    },
  }, 201);
}
