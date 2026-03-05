import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyPassword, isDbAvailable } from "@/lib/auth-service";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "メールアドレスとパスワードを入力してください" }, { status: 400 });
    }

    if (!isDbAvailable()) {
      return NextResponse.json({ error: "データベースが設定されていません" }, { status: 503 });
    }

    const { prisma } = await import("@/lib/db");
    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      await logEvent(prisma, "login_ng", email, null, req);
      return NextResponse.json({ error: "メールアドレスまたはパスワードが正しくありません" }, { status: 401 });
    }

    if (user.isSuspended) {
      await logEvent(prisma, "login_ng", email, user.id, req);
      return NextResponse.json({ error: "このアカウントは凍結されています" }, { status: 403 });
    }

    const passwordValid = await verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      await logEvent(prisma, "login_ng", email, user.id, req);
      return NextResponse.json({ error: "メールアドレスまたはパスワードが正しくありません" }, { status: 401 });
    }

    if (!user.emailVerifiedAt) {
      return NextResponse.json({ error: "メールアドレスが未確認です。確認メールをご確認ください。", needVerify: true }, { status: 403 });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await logEvent(prisma, "login_ok", email, user.id, req);

    // Check profile completion
    const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
    const profileComplete = !!profile;

    // Set session cookie
    const sessionData = {
      userId: user.id,
      email: user.email!,
      role: user.role,
      profileComplete,
    };

    const encoded = btoa(encodeURIComponent(JSON.stringify({ ...sessionData, exp: Date.now() + 24 * 60 * 60 * 1000 })));
    const response = NextResponse.json({ ok: true, profileComplete });
    response.cookies.set("sloty_session", encoded, {
      path: "/",
      maxAge: 24 * 60 * 60,
      sameSite: "lax",
      httpOnly: false, // Client needs to read it for navigation
    });

    return response;
  } catch (e) {
    console.error("[api/auth/login] Error:", e);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}

async function logEvent(prisma: any, eventType: string, email: string, userId: string | null, req: NextRequest) {
  try {
    await prisma.authLog.create({
      data: {
        eventType,
        userEmail: email,
        userId,
        ip: req.headers.get("x-forwarded-for") || null,
        ua: req.headers.get("user-agent")?.slice(0, 255) || null,
      },
    });
  } catch {
    // Don't fail login for logging errors
  }
}
