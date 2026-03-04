import { NextRequest } from "next/server";
import { stripe, TICKET_PACKS } from "@/lib/stripe";
import {
  getAuthenticatedSession,
  success,
  badRequest,
} from "@/lib/api-utils";
import { z } from "zod";

const purchaseSchema = z.object({
  packId: z.string(),
});

// チケットパック購入（Stripe PaymentIntent作成）
export async function POST(req: NextRequest) {
  const { session, errorResponse } = await getAuthenticatedSession();
  if (errorResponse) return errorResponse;

  const body = await req.json();
  const parsed = purchaseSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0].message);
  }

  const pack = TICKET_PACKS.find((p) => p.id === parsed.data.packId);
  if (!pack) {
    return badRequest("無効なパックIDです");
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: pack.priceYen,
    currency: "jpy",
    metadata: {
      type: "ticket_purchase",
      packId: pack.id,
      userId: session!.user.id,
      tickets: pack.tickets.toString(),
    },
  });

  return success({
    paymentIntentClientSecret: paymentIntent.client_secret,
    pack,
  });
}
