import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  getAuthenticatedSession,
  success,
} from "@/lib/api-utils";

// 通知一覧
export async function GET(req: NextRequest) {
  const { session, errorResponse } = await getAuthenticatedSession();
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);
  const unreadOnly = searchParams.get("unread_only") === "true";

  const where: Record<string, unknown> = {
    userId: session!.user.id,
  };
  if (unreadOnly) where.isRead = false;

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: where as never,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.notification.count({
      where: {
        userId: session!.user.id,
        isRead: false,
      },
    }),
  ]);

  return success({ notifications, unreadCount });
}
