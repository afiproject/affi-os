import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { ticketCount, priceYen, paymentMethod } = body;

  if (!ticketCount || !priceYen) {
    return NextResponse.json({ error: "ticketCount and priceYen are required" }, { status: 400 });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;

  // Stripe (credit card / Apple Pay) checkout
  if (paymentMethod === "card" || paymentMethod === "applepay") {
    if (!stripeKey) {
      // デモモード: Stripeキーがない場合はデモ購入として成功を返す
      return NextResponse.json({
        demo: true,
        ok: true,
        ticketCount,
        message: `デモ: ${ticketCount}🎫を購入しました`,
      });
    }
    try {
      const stripe = require("stripe")(stripeKey);
      const session = await stripe.checkout.sessions.create({
        payment_method_types: paymentMethod === "applepay" ? ["card"] : ["card"],
        line_items: [{
          price_data: {
            currency: "jpy",
            product_data: { name: `SLOTY チケット ${ticketCount}枚` },
            unit_amount: priceYen,
          },
          quantity: 1,
        }],
        mode: "payment",
        success_url: `${req.nextUrl.origin}/profile?purchase=success&tickets=${ticketCount}`,
        cancel_url: `${req.nextUrl.origin}/profile?purchase=cancelled`,
        metadata: { ticketCount: String(ticketCount) },
        ...(paymentMethod === "applepay" ? {
          payment_method_options: { card: { request_three_d_secure: "automatic" } },
        } : {}),
      });
      return NextResponse.json({ url: session.url });
    } catch (e: any) {
      return NextResponse.json({ error: e.message || "Stripe session creation failed" }, { status: 500 });
    }
  }

  // PayPay checkout
  if (paymentMethod === "paypay") {
    if (!process.env.PAYPAY_API_KEY) {
      return NextResponse.json({
        demo: true,
        ok: true,
        ticketCount,
        message: `デモ: PayPayで${ticketCount}🎫を購入しました`,
      });
    }
    return NextResponse.json({
      error: "PayPay決済は準備中です。",
    }, { status: 501 });
  }

  // Bank transfer
  if (paymentMethod === "bank") {
    return NextResponse.json({
      demo: true,
      ok: true,
      ticketCount,
      message: `デモ: 口座引落しで${ticketCount}🎫を購入しました`,
    });
  }

  return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
}
