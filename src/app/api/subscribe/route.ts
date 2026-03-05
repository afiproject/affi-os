import { NextRequest, NextResponse } from "next/server";

const PLAN_PRICES: Record<string, number> = {
  basic: 980,
  plus: 1980,
};

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { plan, paymentMethod } = body;

  if (plan === "none") {
    return NextResponse.json({ ok: true, demo: true, message: "サブスクリプションを解約しました" });
  }

  if (!PLAN_PRICES[plan]) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;

  if (paymentMethod === "card" || paymentMethod === "applepay") {
    if (!stripeKey) {
      // デモモード: Stripeキーがない場合はデモサブスクとして成功を返す
      return NextResponse.json({
        demo: true,
        ok: true,
        plan,
        message: `デモ: ${plan === "basic" ? "Basic" : "Plus"}プランに加入しました`,
      });
    }
    try {
      const stripe = require("stripe")(stripeKey);
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [{
          price_data: {
            currency: "jpy",
            product_data: { name: `SLOTY ${plan === "basic" ? "Basic" : "Plus"} プラン` },
            unit_amount: PLAN_PRICES[plan],
            recurring: { interval: "month" },
          },
          quantity: 1,
        }],
        mode: "subscription",
        success_url: `${req.nextUrl.origin}/profile?subscribe=success&plan=${plan}`,
        cancel_url: `${req.nextUrl.origin}/profile?subscribe=cancelled`,
        metadata: { plan },
      });
      return NextResponse.json({ url: session.url });
    } catch (e: any) {
      return NextResponse.json({ error: e.message || "Stripe session creation failed" }, { status: 500 });
    }
  }

  if (paymentMethod === "paypay") {
    return NextResponse.json({
      demo: true,
      ok: true,
      plan,
      message: `デモ: PayPayで${plan === "basic" ? "Basic" : "Plus"}プランに加入しました`,
    });
  }

  if (paymentMethod === "bank") {
    return NextResponse.json({
      demo: true,
      ok: true,
      plan,
      message: `デモ: 口座引落しで${plan === "basic" ? "Basic" : "Plus"}プランに加入しました`,
    });
  }

  return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
}
