import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isDbAvailable } from "@/lib/auth-service";
import { decodeSessionValue, SESSION_COOKIE_NAME } from "@/lib/session";

const profileSchema = z.object({
  displayName: z.string().min(1).max(50),
  nameKanji: z.string().min(1).max(50),
  nameHiragana: z.string().min(1).max(50),
  nameKatakana: z.string().max(50).optional(),
  isForeigner: z.boolean().default(false),
  birthdate: z.string().min(1),
  gender: z.string().max(20).optional(),
  area: z.string().max(100).optional(),
  job: z.string().max(50).optional(),
  interests: z.array(z.string()).max(5).default([]),
  bio: z.string().max(160).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = decodeSessionValue(sessionCookie);
    if (!session) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = profileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    if (!isDbAvailable()) {
      // In demo mode, profile is saved client-side via demo-store
      return NextResponse.json({ ok: true, mode: "demo" });
    }

    const { prisma } = await import("@/lib/db");
    const data = parsed.data;

    await prisma.profile.upsert({
      where: { userId: session.userId },
      create: {
        userId: session.userId,
        displayName: data.displayName,
        nameKanji: data.nameKanji,
        nameHiragana: data.nameHiragana,
        nameKatakana: data.nameKatakana || null,
        isForeigner: data.isForeigner,
        birthdate: new Date(data.birthdate),
        gender: data.gender || null,
        area: data.area || null,
        job: data.job || null,
        interests: data.interests,
        bio: data.bio || null,
      },
      update: {
        displayName: data.displayName,
        nameKanji: data.nameKanji,
        nameHiragana: data.nameHiragana,
        nameKatakana: data.nameKatakana || null,
        isForeigner: data.isForeigner,
        birthdate: new Date(data.birthdate),
        gender: data.gender || null,
        area: data.area || null,
        job: data.job || null,
        interests: data.interests,
        bio: data.bio || null,
      },
    });

    // Update user displayName
    await prisma.user.update({
      where: { id: session.userId },
      data: { displayName: data.displayName },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/onboarding/profile] Error:", e);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
