import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword, generateToken, hashToken, isDbAvailable, getAppOrigin } from "@/lib/auth-service";
import { Resend } from "resend";

const signupSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(8, "パスワードは8文字以上で設定してください"),
  displayName: z.string().min(1, "表示名を入力してください").max(50),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { email, password, displayName } = parsed.data;

    if (!isDbAvailable()) {
      return NextResponse.json({ error: "データベースが設定されていません。DEMO_MODEをご利用ください。" }, { status: 503 });
    }

    const { prisma } = await import("@/lib/db");

    // Check existing user
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "このメールアドレスは既に登録されています" }, { status: 409 });
    }

    // Create user with bcrypt hash
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        displayName,
        role: "USER",
      },
    });

    // Create verification token
    const rawToken = generateToken();
    const tokenHash = hashToken(rawToken);
    await prisma.authVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash,
        type: "verify",
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1h
      },
    });

    // Log signup event
    await prisma.authLog.create({
      data: {
        eventType: "signup",
        userEmail: email,
        userId: user.id,
        ip: req.headers.get("x-forwarded-for") || null,
        ua: req.headers.get("user-agent")?.slice(0, 255) || null,
      },
    });

    // Send verification email
    const origin = getAppOrigin();
    const verifyUrl = `${origin}/auth/verify?token=${rawToken}`;

    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const from = process.env.EMAIL_FROM || "SLOTY <onboarding@resend.dev>";
      await resend.emails.send({
        from,
        to: email,
        subject: "【SLOTY】メールアドレスの確認",
        html: buildVerifyEmailHtml(verifyUrl),
      });

      await prisma.authLog.create({
        data: { eventType: "verify_sent", userEmail: email, userId: user.id },
      });
    }

    return NextResponse.json({ ok: true, needVerify: true });
  } catch (e) {
    console.error("[api/auth/signup] Error:", e);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}

function buildVerifyEmailHtml(verifyUrl: string): string {
  return `
    <div style="max-width:480px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#333">
      <div style="padding:24px 0;text-align:center">
        <h1 style="font-size:28px;font-weight:800;background:linear-gradient(135deg,#7B8CFF,#B79DFF,#F3A7C6);-webkit-background-clip:text;-webkit-text-fill-color:transparent">SLOTY</h1>
      </div>
      <div style="padding:24px;background:#f9f9fb;border-radius:12px">
        <h2 style="font-size:18px;margin:0 0 12px">メールアドレスの確認</h2>
        <p style="font-size:14px;line-height:1.6;color:#555">以下のボタンをクリックして、メールアドレスを確認してください。</p>
        <p style="margin:16px 0"><a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#7B8CFF;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">メールを確認する</a></p>
        <p style="font-size:12px;color:#999;margin-top:16px">このリンクは1時間で有効期限が切れます。</p>
      </div>
      <p style="margin-top:24px;font-size:11px;color:#999;text-align:center">このメールに心当たりがない場合は無視してください。</p>
    </div>
  `;
}
