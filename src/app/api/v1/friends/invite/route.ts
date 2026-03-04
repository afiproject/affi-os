import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { randomBytes } from "crypto";
import {
  getAuthenticatedSession,
  success,
  badRequest,
  rateLimited,
} from "@/lib/api-utils";
import { DAILY_LIMITS } from "@/lib/tickets";
import { z } from "zod";

const inviteSchema = z.object({
  type: z.enum(["qr", "link"]),
});

// 招待トークン発行
export async function POST(req: NextRequest) {
  const { session, errorResponse } = await getAuthenticatedSession();
  if (errorResponse) return errorResponse;

  const body = await req.json();
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0].message);
  }

  // レート制限チェック（10回/日）
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayInviteCount = await prisma.invite.count({
    where: {
      inviterUserId: session!.user.id,
      createdAt: { gte: todayStart },
    },
  });
  if (todayInviteCount >= DAILY_LIMITS.INVITES) {
    return rateLimited();
  }

  const token = randomBytes(32).toString("hex");
  const expiresMinutes = parsed.data.type === "qr" ? 5 : 15;
  const expiresAt = new Date(Date.now() + expiresMinutes * 60 * 1000);

  const invite = await prisma.invite.create({
    data: {
      inviterUserId: session!.user.id,
      token,
      type: parsed.data.type,
      expiresAt,
      maxUses: 1,
    },
  });

  const inviteUrl =
    parsed.data.type === "link"
      ? `${process.env.NEXTAUTH_URL}/friends/accept?token=${token}`
      : undefined;

  return success({ token, expiresAt, inviteUrl }, 201);
}
