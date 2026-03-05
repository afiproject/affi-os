import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  getAuthenticatedSession,
  success,
  badRequest,
  notFound,
} from "@/lib/api-utils";
import { z } from "zod";

const acceptSchema = z.object({
  token: z.string().min(1),
});

// 招待を承認 → フレンド成立（双方向レコード作成）
export async function POST(req: NextRequest) {
  const { session, errorResponse } = await getAuthenticatedSession();
  if (errorResponse) return errorResponse;

  const body = await req.json();
  const parsed = acceptSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0].message);
  }

  const invite = await prisma.invite.findUnique({
    where: { token: parsed.data.token },
  });

  if (!invite) return notFound("招待が見つかりません");

  // 有効期限チェック
  if (new Date() > invite.expiresAt) {
    return badRequest("この招待は期限切れです");
  }

  // 使用回数チェック
  if (invite.usedCount >= invite.maxUses) {
    return badRequest("この招待は既に使用されています");
  }

  // 自分自身の招待は不可
  if (invite.inviterUserId === session!.user.id) {
    return badRequest("自分自身をフレンドに追加することはできません");
  }

  // 既にフレンド関係がないかチェック
  const existingFriend = await prisma.friend.findUnique({
    where: {
      userId_friendUserId: {
        userId: session!.user.id,
        friendUserId: invite.inviterUserId,
      },
    },
  });
  if (existingFriend) {
    return badRequest("既にフレンドです");
  }

  // トランザクション: 双方向のフレンドレコード作成 + 招待使用カウント更新
  const result = await prisma.$transaction(async (tx: any) => {
    // 双方向のフレンドレコード
    const friend1 = await tx.friend.create({
      data: {
        userId: session!.user.id,
        friendUserId: invite.inviterUserId,
        status: "accepted",
        permissionLevel: "busy_only",
      },
    });
    const friend2 = await tx.friend.create({
      data: {
        userId: invite.inviterUserId,
        friendUserId: session!.user.id,
        status: "accepted",
        permissionLevel: "busy_only",
      },
    });

    // 招待使用カウント更新
    await tx.invite.update({
      where: { id: invite.id },
      data: { usedCount: { increment: 1 } },
    });

    return { friend1, friend2 };
  });

  // TODO: 招待者にフレンド承認通知を送信

  return success({ friend: result.friend1 }, 201);
}
