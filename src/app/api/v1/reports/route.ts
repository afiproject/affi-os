import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  getAuthenticatedSession,
  success,
  badRequest,
} from "@/lib/api-utils";
import { z } from "zod";

const reportSchema = z.object({
  targetType: z.enum(["user", "slot", "post"]),
  targetId: z.string().uuid(),
  reason: z.string().min(1).max(50),
  detail: z.string().max(1000).optional(),
});

export async function POST(req: NextRequest) {
  const { session, errorResponse } = await getAuthenticatedSession();
  if (errorResponse) return errorResponse;

  const body = await req.json();
  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0].message);
  }

  const data = parsed.data;

  // 24h以内の重複通報チェック
  const recentReport = await prisma.report.findFirst({
    where: {
      reporterUserId: session!.user.id,
      targetType: data.targetType,
      targetId: data.targetId,
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    },
  });
  if (recentReport) {
    return badRequest("同じ対象への通報は24時間以内に1回までです");
  }

  const report = await prisma.report.create({
    data: {
      reporterUserId: session!.user.id,
      targetType: data.targetType,
      targetId: data.targetId,
      reason: data.reason,
      detail: data.detail ?? null,
    },
  });

  // 同一ターゲットへの通報が3件以上で自動非表示
  const reportCount = await prisma.report.count({
    where: {
      targetType: data.targetType,
      targetId: data.targetId,
    },
  });

  if (reportCount >= 3) {
    if (data.targetType === "post") {
      await prisma.squarePost.update({
        where: { id: data.targetId },
        data: { status: "hidden" },
      });
    }
    // TODO: slot, user の自動非表示処理
  }

  return success({ report }, 201);
}
