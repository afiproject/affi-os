import { NextRequest, NextResponse } from "next/server";
import { generateToken, hashToken, isDbAvailable, getAppOrigin } from "@/lib/auth-service";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "メールアドレスを入力してください" }, { status: 400 });
    }

    if (!isDbAvailable()) {
      return NextResponse.json({ error: "データベースが設定されていません" }, { status: 503 });
    }

    const { prisma } = await import("@/lib/db");

    // Don't reveal whether user exists
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ ok: true }); // Silent success
    }

    const rawToken = generateToken();
    const tokenHash = hashToken(rawToken);
    await prisma.authVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash,
        type: "reset",
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    await prisma.authLog.create({
      data: { eventType: "password_reset_sent", userEmail: email, userId: user.id },
    });

    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const from = process.env.EMAIL_FROM || "SLOTY <onboarding@resend.dev>";
      const origin = getAppOrigin();
      await resend.emails.send({
        from,
        to: email,
        subject: "【SLOTY】パスワードリセット",
        html: `
          <div style="max-width:480px;margin:0 auto;font-family:-apple-system,sans-serif;color:#333">
            <div style="padding:24px 0;text-align:center">
              <h1 style="font-size:28px;font-weight:800;background:linear-gradient(135deg,#7B8CFF,#B79DFF,#F3A7C6);-webkit-background-clip:text;-webkit-text-fill-color:transparent">SLOTY</h1>
            </div>
            <div style="padding:24px;background:#f9f9fb;border-radius:12px">
              <h2 style="font-size:18px;margin:0 0 12px">パスワードリセット</h2>
              <p style="font-size:14px;line-height:1.6;color:#555">以下のボタンからパスワードを再設定してください。</p>
              <p style="margin:16px 0"><a href="${origin}/auth/reset-password?token=${rawToken}" style="display:inline-block;padding:12px 24px;background:#7B8CFF;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">パスワードをリセットする</a></p>
            </div>
          </div>
        `,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/auth/forgot] Error:", e);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
