import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { checkConflicts } from "@/lib/conflicts";
import { calculateSlotScore } from "@/lib/scoring";
import {
  getAuthenticatedSession,
  success,
  badRequest,
  conflict,
} from "@/lib/api-utils";
import { z } from "zod";

// スロット検索
export async function GET(req: NextRequest) {
  const { session, errorResponse } = await getAuthenticatedSession();
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(req.url);
  const timeStart = searchParams.get("time_start");
  const timeEnd = searchParams.get("time_end");
  const mode = searchParams.get("mode") as "call" | "in_person" | null;
  const category = searchParams.get("category");
  const maxPrice = searchParams.get("max_price");
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const radiusKm = searchParams.get("radius_km");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);

  // クエリ構築
  const where: Record<string, unknown> = {
    status: "listed",
    startAt: { gte: new Date() },
  };

  if (timeStart && timeEnd) {
    where.startAt = { gte: new Date(timeStart) };
    where.endAt = { lte: new Date(timeEnd) };
  }
  if (mode) where.mode = mode;
  if (category) where.category = category;
  if (maxPrice) where.priceYen = { lte: parseInt(maxPrice) };

  const [slots, total] = await Promise.all([
    prisma.slot.findMany({
      where: where as never,
      include: {
        seller: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            verificationStatus: true,
            ratingAvg: true,
            ratingCount: true,
            cancelRate: true,
            createdAt: true,
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { startAt: "asc" },
    }),
    prisma.slot.count({ where: where as never }),
  ]);

  // スコアリング
  const scoredSlots = slots
    .map((slot) => ({
      ...slot,
      score: calculateSlotScore(slot as never, {
        targetLat: lat ? parseFloat(lat) : undefined,
        targetLng: lng ? parseFloat(lng) : undefined,
        targetStartAt: timeStart ? new Date(timeStart) : undefined,
        targetEndAt: timeEnd ? new Date(timeEnd) : undefined,
        targetCategory: category ?? undefined,
        targetMaxPrice: maxPrice ? parseInt(maxPrice) : undefined,
      }),
    }))
    .sort((a, b) => b.score - a.score);

  // exact_location を除外（成立前は非表示）
  const sanitized = scoredSlots.map(({ score: _score, ...slot }) => ({
    ...slot,
    exactLocation: undefined,
  }));

  return success({ slots: sanitized, total, page });
}

// スロット出品
const createSlotSchema = z.object({
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  durationMinutes: z.number().refine((v) => [30, 60, 90].includes(v)),
  mode: z.enum(["call", "in_person"]),
  category: z.string().min(1),
  priceYen: z.number().min(0),
  areaType: z.enum(["city", "radius", "region"]).optional(),
  areaValue: z.string().optional(),
  areaLat: z.number().optional(),
  areaLng: z.number().optional(),
  areaRadiusKm: z.number().optional(),
  exactLocation: z.string().optional(),
  bookingType: z.enum(["instant", "approval"]),
});

export async function POST(req: NextRequest) {
  const { session, errorResponse } = await getAuthenticatedSession();
  if (errorResponse) return errorResponse;

  const body = await req.json();
  const parsed = createSlotSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0].message);
  }

  const data = parsed.data;
  const startAt = new Date(data.startAt);
  const endAt = new Date(data.endAt);

  // 時間の検証
  if (endAt <= startAt) {
    return badRequest("終了時刻は開始時刻より後にしてください");
  }
  if (startAt <= new Date()) {
    return badRequest("開始時刻は現在時刻より後にしてください");
  }

  // 衝突チェック
  const conflicts = await checkConflicts(session!.user.id, { startAt, endAt });
  if (conflicts.hasConflict) {
    return conflict("この時間帯に既存の予定またはスロットがあります", {
      conflictingSlots: conflicts.conflictingSlots,
      conflictingEvents: conflicts.conflictingEvents.map((e) => ({
        id: e.id,
        startAt: e.startAt,
        endAt: e.endAt,
      })),
    });
  }

  const slot = await prisma.slot.create({
    data: {
      sellerUserId: session!.user.id,
      startAt,
      endAt,
      durationMinutes: data.durationMinutes,
      mode: data.mode,
      category: data.category,
      priceYen: data.priceYen,
      areaType: data.areaType ?? null,
      areaValue: data.areaValue ?? null,
      areaLat: data.areaLat ?? null,
      areaLng: data.areaLng ?? null,
      areaRadiusKm: data.areaRadiusKm ?? null,
      exactLocation: data.exactLocation ?? null,
      bookingType: data.bookingType,
      status: "listed",
    },
  });

  return success({ slot }, 201);
}
