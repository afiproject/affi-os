import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { grantTickets, TICKET_REFUNDS } from "@/lib/tickets";
import {
  getAuthenticatedSession,
  success,
  badRequest,
  notFound,
  forbidden,
} from "@/lib/api-utils";

// 依頼を拒否: 半額返金
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, errorResponse } = await getAuthenticatedSession();
  if (errorResponse) return errorResponse;

  const { id } = await params;

  const request = await prisma.request.findUnique({
    where: { id },
  });

  if (!request) return notFound("依頼が見つかりません");
  if (request.toUserId !== session!.user.id) return forbidden();
  if (request.status !== "sent") return badRequest("この依頼は既に処理済みです");

  // ステータス更新
  await prisma.request.update({
    where: { id },
    data: { status: "rejected" },
  });

  // 半額返金（2🎫）
  const refundResult = await grantTickets({
    userId: request.fromUserId,
    amount: TICKET_REFUNDS.REQUEST_REJECTED,
    reason: "refund",
    refType: "request",
    refId: request.id,
    idempotencyKey: `refund_reject_${request.id}`,
  });

  // TODO: 依頼者に拒否通知を送信

  return success({
    request: { ...request, status: "rejected" },
    refundTickets: TICKET_REFUNDS.REQUEST_REJECTED,
  });
}
