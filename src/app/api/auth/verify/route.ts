import { NextRequest, NextResponse } from "next/server";
import { hashToken, isDbAvailable } from "@/lib/auth-service";

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");
    if (!token) {
      return NextResponse.json({ error: "トークンがありません" }, { status: 400 });
    }

    if (!isDbAvailable()) {
      return NextResponse.json({ error: "データベースが設定されていません" }, { status: 503 });
    }

    const { prisma } = await import("@/lib/db");
    const tokenHash = hashToken(token);

    const verifyToken = await prisma.authVerificationToken.findFirst({
      where: {
        tokenHash,
        type: "verify",
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!verifyToken) {
      return NextResponse.json({ error: "トークンが無効または期限切れです" }, { status: 400 });
    }

    // Mark token as used and verify email
    await prisma.$transaction([
      prisma.authVerificationToken.update({
        where: { id: verifyToken.id },
        data: { usedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: verifyToken.userId },
        data: { emailVerifiedAt: new Date() },
      }),
    ]);

    await prisma.authLog.create({
      data: {
        eventType: "verify_ok",
        userEmail: verifyToken.user.email,
        userId: verifyToken.userId,
        ip: req.headers.get("x-forwarded-for") || null,
        ua: req.headers.get("user-agent")?.slice(0, 255) || null,
      },
    });

    return NextResponse.json({ ok: true, email: verifyToken.user.email, userId: verifyToken.userId });
  } catch (e) {
    console.error("[api/auth/verify] Error:", e);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
