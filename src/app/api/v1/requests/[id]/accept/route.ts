import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { stripe, PLATFORM_FEE_RATE } from "@/lib/stripe";
import {
  getAuthenticatedSession,
  success,
  badRequest,
  notFound,
  forbidden,
} from "@/lib/api-utils";

// 依頼を承認: Slot自動生成 → Booking作成
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, errorResponse } = await getAuthenticatedSession();
  if (errorResponse) return errorResponse;

  const { id } = await params;

  const request = await prisma.request.findUnique({
    where: { id },
    include: { post: true },
  });

  if (!request) return notFound("依頼が見つかりません");
  if (request.toUserId !== session!.user.id) return forbidden();
  if (request.status !== "sent") return badRequest("この依頼は既に処理済みです");

  // タイムアウトチェック（24h）
  const timeoutAt = new Date(request.createdAt.getTime() + 24 * 60 * 60 * 1000);
  if (new Date() > timeoutAt) {
    return badRequest("この依頼はタイムアウトしました");
  }

  const body = await req.json().catch(() => ({}));
  const priceYen = body.priceYen ?? request.budgetYen;

  const result = await prisma.$transaction(async (tx: any) => {
    // 1. Slot自動生成
    const startAt = request.desiredStartAt ?? new Date();
    const endAt = new Date(
      startAt.getTime() + request.durationMinutes * 60 * 1000
    );

    const slot = await tx.slot.create({
      data: {
        sellerUserId: session!.user.id,
        startAt,
        endAt,
        durationMinutes: request.durationMinutes,
        mode: request.mode,
        category: request.post.tags[0] ?? "chat",
        priceYen,
        bookingType: "instant",
        status: "booked_confirmed",
      },
    });

    // 2. Booking作成
    const feeYen = Math.round(priceYen * PLATFORM_FEE_RATE);
    const booking = await tx.booking.create({
      data: {
        slotId: slot.id,
        buyerUserId: request.fromUserId,
        sellerUserId: session!.user.id,
        status: "confirmed",
        amountYen: priceYen,
        feeYen,
        confirmedAt: new Date(),
      },
    });

    // 3. Request ステータス更新
    await tx.request.update({
      where: { id: request.id },
      data: {
        status: "accepted",
        generatedSlotId: slot.id,
      },
    });

    return { slot, booking };
  });

  // TODO: 依頼者に承認通知を送信
  // TODO: Stripe PaymentIntentの作成

  return success({
    request: { ...request, status: "accepted" },
    slot: result.slot,
    booking: result.booking,
  });
}
