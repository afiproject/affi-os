import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword, isDbAvailable } from "@/lib/auth-service";

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

    // Create user with bcrypt hash (auto-verified, no email confirmation needed)
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        displayName,
        role: "USER",
        emailVerifiedAt: new Date(),
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

    return NextResponse.json({ ok: true, needVerify: false });
  } catch (e) {
    console.error("[api/auth/signup] Error:", e);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}