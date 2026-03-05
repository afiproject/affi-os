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
import { z } from "zod";

// 予約作成（購入）
const createBookingSchema = z.object({
  slotId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  const { session, errorResponse } = await getAuthenticatedSession();
  if (errorResponse) return errorResponse;

  const body = await req.json();
  const parsed = createBookingSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0].message);
  }

  const slot = await prisma.slot.findUnique({
    where: { id: parsed.data.slotId },
    include: { seller: true },
  });

  if (!slot) return notFound("スロットが見つかりません");
  if (slot.status !== "listed") return badRequest("このスロットは現在購入できません");
  if (slot.sellerUserId === session!.user.id) {
    return forbidden();
  }

  const feeYen = Math.round(slot.priceYen * PLATFORM_FEE_RATE);

  // Stripe PaymentIntent 作成（与信）
  const paymentIntent = await stripe.paymentIntents.create({
    amount: slot.priceYen,
    currency: "jpy",
    capture_method: "manual", // エスクロー: 手動キャプチャ
    metadata: {
      slotId: slot.id,
      buyerUserId: session!.user.id,
      sellerUserId: slot.sellerUserId,
    },
  });

  // Booking レコード作成
  const booking = await prisma.$transaction(async (tx: any) => {
    const newBooking = await tx.booking.create({
      data: {
        slotId: slot.id,
        buyerUserId: session!.user.id,
        sellerUserId: slot.sellerUserId,
        status: "payment_authorized",
        paymentIntentId: paymentIntent.id,
        amountYen: slot.priceYen,
        feeYen,
      },
    });

    // 即確定の場合: スロットステータスも更新
    if (slot.bookingType === "instant") {
      await tx.slot.update({
        where: { id: slot.id },
        data: { status: "booked_confirmed" },
      });
      await tx.booking.update({
        where: { id: newBooking.id },
        data: {
          status: "confirmed",
          confirmedAt: new Date(),
        },
      });
      // TODO: 通知を送信
    } else {
      // 承認制: BOOKED_PENDING
      await tx.slot.update({
        where: { id: slot.id },
        data: { status: "booked_pending" },
      });
      // TODO: 売り手に承認依頼通知を送信
    }

    return newBooking;
  });

  return success(
    {
      booking,
      paymentIntentClientSecret: paymentIntent.client_secret,
    },
    201
  );
}

// 自分の予約一覧
export async function GET(req: NextRequest) {
  const { session, errorResponse } = await getAuthenticatedSession();
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role") ?? "buyer";
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);

  const where: Record<string, unknown> = {};
  if (role === "buyer") {
    where.buyerUserId = session!.user.id;
  } else {
    where.sellerUserId = session!.user.id;
  }
  if (status) where.status = status;

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where: where as never,
      include: {
        slot: true,
        buyer: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            verificationStatus: true,
            ratingAvg: true,
          },
        },
        seller: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            verificationStatus: true,
            ratingAvg: true,
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.booking.count({ where: where as never }),
  ]);

  return success({ bookings, total, page });
}
