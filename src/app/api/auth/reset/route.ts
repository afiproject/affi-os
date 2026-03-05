import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword, hashToken, isDbAvailable } from "@/lib/auth-service";

const resetSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "パスワードは8文字以上で設定してください"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = resetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    if (!isDbAvailable()) {
      return NextResponse.json({ error: "データベースが設定されていません" }, { status: 503 });
    }

    const { prisma } = await import("@/lib/db");
    const { token, password } = parsed.data;
    const tokenHash = hashToken(token);

    const resetToken = await prisma.authVerificationToken.findFirst({
      where: {
        tokenHash,
        type: "reset",
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!resetToken) {
      return NextResponse.json({ error: "トークンが無効または期限切れです" }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    await prisma.$transaction([
      prisma.authVerificationToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
    ]);

    await prisma.authLog.create({
      data: {
        eventType: "password_reset_ok",
        userId: resetToken.userId,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/auth/reset] Error:", e);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
