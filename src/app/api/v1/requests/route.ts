import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  consumeTickets,
  grantTickets,
  TICKET_COSTS,
  TICKET_REFUNDS,
  DAILY_LIMITS,
} from "@/lib/tickets";
import { containsExternalContact } from "@/lib/text-filter";
import {
  getAuthenticatedSession,
  success,
  badRequest,
  notFound,
  forbidden,
  insufficientTickets,
  rateLimited,
} from "@/lib/api-utils";
import { z } from "zod";

// 依頼受信箱
export async function GET(req: NextRequest) {
  const { session, errorResponse } = await getAuthenticatedSession();
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(req.url);
  const direction = searchParams.get("direction") ?? "inbox"; // inbox or sent
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);

  const where: Record<string, unknown> = {};
  if (direction === "inbox") {
    where.toUserId = session!.user.id;
  } else {
    where.fromUserId = session!.user.id;
  }
  if (status) where.status = status;

  const [requests, total] = await Promise.all([
    prisma.request.findMany({
      where: where as never,
      include: {
        post: {
          select: { id: true, text: true, tags: true },
        },
        fromUser: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            verificationStatus: true,
            ratingAvg: true,
          },
        },
        toUser: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.request.count({ where: where as never }),
  ]);

  return success({ requests, total, page });
}

// 依頼を送信（POST /api/v1/square/posts/:id/request から呼ばれる想定だが、
// ルーティングの都合上ここにも配置）
const createRequestSchema = z.object({
  postId: z.string().uuid(),
  desiredStartAt: z.string().datetime().optional(),
  desiredWindow: z.enum(["now", "today", "specified"]),
  mode: z.enum(["call", "in_person"]),
  durationMinutes: z.number().refine((v) => [30, 60, 90].includes(v)),
  budgetYen: z.number().min(0),
  noteShort: z.string().max(80).optional(),
});

export async function POST(req: NextRequest) {
  const { session, errorResponse } = await getAuthenticatedSession();
  if (errorResponse) return errorResponse;

  const body = await req.json();
  const parsed = createRequestSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0].message);
  }

  const data = parsed.data;

  // 投稿の存在確認
  const post = await prisma.squarePost.findUnique({
    where: { id: data.postId },
  });
  if (!post) return notFound("投稿が見つかりません");
  if (post.status !== "active") return badRequest("この投稿は現在利用できません");

  // 自分の投稿への依頼は不可
  if (post.userId === session!.user.id) {
    return forbidden();
  }

  // ひとことのフィルタ
  if (data.noteShort) {
    const filter = containsExternalContact(data.noteShort);
    if (filter.hasViolation) {
      return badRequest("外部連絡先の共有は禁止されています");
    }
  }

  // 日次依頼上限チェック
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayRequestCount = await prisma.request.count({
    where: {
      fromUserId: session!.user.id,
      createdAt: { gte: todayStart },
    },
  });
  if (todayRequestCount >= DAILY_LIMITS.REQUESTS) {
    return rateLimited();
  }

  // 同一ユーザーへの連続依頼制限（1日3件まで）
  const todayToSameUser = await prisma.request.count({
    where: {
      fromUserId: session!.user.id,
      toUserId: post.userId,
      createdAt: { gte: todayStart },
    },
  });
  if (todayToSameUser >= 3) {
    return rateLimited();
  }

  // チケット消費
  const ticketResult = await consumeTickets({
    userId: session!.user.id,
    amount: TICKET_COSTS.SQUARE_REQUEST,
    reason: "request",
    refType: "request",
  });
  if (!ticketResult.success) {
    return insufficientTickets();
  }

  const request = await prisma.request.create({
    data: {
      postId: data.postId,
      fromUserId: session!.user.id,
      toUserId: post.userId,
      desiredStartAt: data.desiredStartAt
        ? new Date(data.desiredStartAt)
        : null,
      desiredWindow: data.desiredWindow,
      mode: data.mode,
      durationMinutes: data.durationMinutes,
      budgetYen: data.budgetYen,
      noteShort: data.noteShort ?? null,
      ticketCost: TICKET_COSTS.SQUARE_REQUEST,
    },
  });

  // TODO: 受信者に通知を送信

  return success(
    { request, ticketCost: TICKET_COSTS.SQUARE_REQUEST },
    201
  );
}
