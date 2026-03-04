import { prisma } from "./db";

interface TimeRange {
  startAt: Date;
  endAt: Date;
}

interface ConflictResult {
  hasConflict: boolean;
  conflictingSlots: { id: string; startAt: Date; endAt: Date }[];
  conflictingEvents: { id: string; startAt: Date; endAt: Date }[];
}

/**
 * 指定ユーザーの指定時間帯が、既存スロットおよび非公開予定と衝突するかチェック
 */
export async function checkConflicts(
  userId: string,
  timeRange: TimeRange,
  excludeSlotId?: string
): Promise<ConflictResult> {
  // 非公開予定との衝突チェック
  const conflictingEvents = await prisma.privateEvent.findMany({
    where: {
      userId,
      startAt: { lt: timeRange.endAt },
      endAt: { gt: timeRange.startAt },
    },
    select: { id: true, startAt: true, endAt: true },
  });

  // 既存スロット（LISTED/BOOKED_PENDING/BOOKED_CONFIRMED）との衝突チェック
  const conflictingSlots = await prisma.slot.findMany({
    where: {
      sellerUserId: userId,
      status: { in: ["listed", "booked_pending", "booked_confirmed"] },
      startAt: { lt: timeRange.endAt },
      endAt: { gt: timeRange.startAt },
      ...(excludeSlotId ? { id: { not: excludeSlotId } } : {}),
    },
    select: { id: true, startAt: true, endAt: true },
  });

  return {
    hasConflict: conflictingEvents.length > 0 || conflictingSlots.length > 0,
    conflictingSlots,
    conflictingEvents,
  };
}

/**
 * 非公開予定追加時に既存スロットとの衝突を検知し、
 * 衝突するLISTEDスロットをPAUSEDに変更する
 */
export async function handlePrivateEventConflicts(
  userId: string,
  timeRange: TimeRange
): Promise<{
  pausedSlots: string[];
  warningSlots: string[];
}> {
  // LISTEDスロットとの衝突 → PAUSED
  const listedConflicts = await prisma.slot.findMany({
    where: {
      sellerUserId: userId,
      status: "listed",
      startAt: { lt: timeRange.endAt },
      endAt: { gt: timeRange.startAt },
    },
  });

  const pausedSlots: string[] = [];
  for (const slot of listedConflicts) {
    await prisma.slot.update({
      where: { id: slot.id },
      data: { status: "paused" },
    });
    pausedSlots.push(slot.id);
  }

  // BOOKED_CONFIRMEDスロットとの衝突 → 警告のみ（自動キャンセルしない）
  const confirmedConflicts = await prisma.slot.findMany({
    where: {
      sellerUserId: userId,
      status: "booked_confirmed",
      startAt: { lt: timeRange.endAt },
      endAt: { gt: timeRange.startAt },
    },
    select: { id: true },
  });

  const warningSlots = confirmedConflicts.map((s) => s.id);

  return { pausedSlots, warningSlots };
}
