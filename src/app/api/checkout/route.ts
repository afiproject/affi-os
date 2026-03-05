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
      return NextResponse.json({ error: "STRIPE_SECRET_KEY が設定されていません。管理者に連絡してください。" }, { status: 500 });
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
    // PayPay integration placeholder
    // In production, integrate with PayPay Web Payment API
    return NextResponse.json({
      error: "PayPay決済は準備中です。PAYPAY_API_KEY を設定してください。",
    }, { status: 501 });
  }

  // Bank transfer
  if (paymentMethod === "bank") {
    // Bank transfer integration placeholder
    return NextResponse.json({
      error: "口座引落しは準備中です。銀行APIの設定が必要です。",
    }, { status: 501 });
  }

  return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
}
