import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { randomBytes } from "crypto";
import {
  getAuthenticatedSession,
  success,
  badRequest,
  notFound,
  rateLimited,
} from "@/lib/api-utils";
import { DAILY_LIMITS } from "@/lib/tickets";

// フレンド一覧
export async function GET(req: NextRequest) {
  const { session, errorResponse } = await getAuthenticatedSession();
  if (errorResponse) return errorResponse;

  const friends = await prisma.friend.findMany({
    where: {
      userId: session!.user.id,
      status: "accepted",
    },
    include: {
      friend: {
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return success({ friends });
}
