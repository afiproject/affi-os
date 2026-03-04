import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { consumeTickets, TICKET_COSTS, DAILY_LIMITS } from "@/lib/tickets";
import { containsExternalContact, sanitizeText } from "@/lib/text-filter";
import {
  getAuthenticatedSession,
  success,
  badRequest,
  insufficientTickets,
  rateLimited,
} from "@/lib/api-utils";
import { z } from "zod";

// 投稿一覧
export async function GET(req: NextRequest) {
  const { session, errorResponse } = await getAuthenticatedSession();
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(req.url);
  const tag = searchParams.get("tag");
  const mode = searchParams.get("mode");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);

  const where: Record<string, unknown> = {
    status: "active",
  };
  if (tag) where.tags = { has: tag };
  if (mode) where.preferredMode = mode;

  const [posts, total] = await Promise.all([
    prisma.squarePost.findMany({
      where: where as never,
      include: {
        user: {
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
    prisma.squarePost.count({ where: where as never }),
  ]);

  return success({ posts, total, page });
}

// 投稿作成
const createPostSchema = z.object({
  text: z.string().min(1).max(280),
  tags: z.array(z.string()).min(1),
  preferredMode: z.enum(["call", "in_person", "either"]),
});

export async function POST(req: NextRequest) {
  const { session, errorResponse } = await getAuthenticatedSession();
  if (errorResponse) return errorResponse;

  const body = await req.json();
  const parsed = createPostSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0].message);
  }

  const { text, tags, preferredMode } = parsed.data;

  // テキストフィルタ（外部誘導チェック）
  const filter = containsExternalContact(text);
  if (filter.hasViolation) {
    return badRequest(
      `投稿に${filter.violations.join("、")}が含まれています。外部連絡先の共有は禁止されています。`
    );
  }

  // 日次投稿上限チェック
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayPostCount = await prisma.squarePost.count({
    where: {
      userId: session!.user.id,
      createdAt: { gte: todayStart },
    },
  });
  if (todayPostCount >= DAILY_LIMITS.POSTS) {
    return rateLimited();
  }

  // チケット消費
  const ticketResult = await consumeTickets({
    userId: session!.user.id,
    amount: TICKET_COSTS.SQUARE_POST,
    reason: "post",
    refType: "post",
  });
  if (!ticketResult.success) {
    return insufficientTickets();
  }

  const sanitizedText = sanitizeText(text);

  const post = await prisma.squarePost.create({
    data: {
      userId: session!.user.id,
      text: sanitizedText,
      tags,
      preferredMode,
    },
  });

  return success({ post, ticketCost: TICKET_COSTS.SQUARE_POST }, 201);
}
