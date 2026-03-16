// ========================================
// スケジューリングサービス
// 投稿時間の最適化・衝突回避
// ※ 全てのピーク時間はJST（UTC+9）で指定し、
//   内部でUTCに変換して処理する
// ========================================

import type { ScheduledPost } from "@/types";

export interface TimeSlot {
  hour: number; // UTC hour
  minute: number;
  score: number;
}

export interface ScheduleConstraints {
  daily_limit: number;
  min_interval_minutes: number;
  allow_night: boolean;
  night_start_jst: number;
  night_end_jst: number;
  peak_hours_jst: number[];
  peak_half_hours_jst?: number[];
}

const JST_OFFSET = 9; // UTC+9

function jstHourToUtc(jstHour: number): number {
  return ((jstHour - JST_OFFSET) + 24) % 24;
}

const DEFAULT_CONSTRAINTS: ScheduleConstraints = {
  daily_limit: 8,
  min_interval_minutes: 60,
  allow_night: false,
  night_start_jst: 1,  // JST 01:00
  night_end_jst: 7,    // JST 07:00
  peak_hours_jst: [22, 23, 21, 20, 12, 15, 10], // JST（Noimos AI推奨: 22-24時がベスト）
  peak_half_hours_jst: [22.25, 22.75, 23.25],  // JST 22:15, 22:45, 23:15
};

export function findOptimalTimeSlots(
  existingScheduled: ScheduledPost[],
  count: number,
  constraints: ScheduleConstraints = DEFAULT_CONSTRAINTS
): TimeSlot[] {
  const slots: TimeSlot[] = [];

  // 既存の予約時間を取得（UTC分単位）
  const occupiedTimes = existingScheduled
    .filter((s) => s.status === "scheduled" || s.status === "pending_approval")
    .map((s) => {
      const d = new Date(s.scheduled_at);
      return d.getUTCHours() * 60 + d.getUTCMinutes();
    });

  // 日の残り予約可能数
  const remaining = Math.min(count, constraints.daily_limit - existingScheduled.length);

  // ピーク時間（JST → UTC変換）
  const allPeaks: { hour: number; minute: number; jstHour: number }[] =
    constraints.peak_hours_jst.map((h) => ({
      hour: jstHourToUtc(h),
      minute: 0,
      jstHour: h,
    }));

  if (constraints.peak_half_hours_jst) {
    for (const hh of constraints.peak_half_hours_jst) {
      const jstH = Math.floor(hh);
      const jstM = Math.round((hh % 1) * 60);
      allPeaks.push({
        hour: jstHourToUtc(jstH),
        minute: jstM,
        jstHour: jstH,
      });
    }
  }

  // UTC時間順にソート
  allPeaks.sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute));

  for (const peak of allPeaks) {
    if (slots.length >= remaining) break;

    // 深夜チェック（JST基準）
    if (!constraints.allow_night &&
        peak.jstHour >= constraints.night_start_jst &&
        peak.jstHour < constraints.night_end_jst) {
      continue;
    }

    const minuteInDay = peak.hour * 60 + peak.minute;

    // 既存予約との間隔チェック
    const tooClose = occupiedTimes.some(
      (t) => Math.abs(t - minuteInDay) < constraints.min_interval_minutes
    );

    if (!tooClose) {
      slots.push({
        hour: peak.hour,
        minute: peak.minute,
        score: 90,
      });
      occupiedTimes.push(minuteInDay);
    }
  }

  // ピーク時間で足りない場合、他のJST日中時間帯を補完
  if (slots.length < remaining) {
    for (let jstH = 9; jstH <= 23; jstH++) {
      if (slots.length >= remaining) break;
      const utcH = jstHourToUtc(jstH);
      if (slots.some((s) => s.hour === utcH)) continue;
      if (!constraints.allow_night &&
          jstH >= constraints.night_start_jst &&
          jstH < constraints.night_end_jst) continue;

      const minuteInDay = utcH * 60;
      const tooClose = occupiedTimes.some(
        (t) => Math.abs(t - minuteInDay) < constraints.min_interval_minutes
      );

      if (!tooClose) {
        slots.push({ hour: utcH, minute: 0, score: 40 });
        occupiedTimes.push(minuteInDay);
      }
    }
  }

  return slots.sort((a, b) => a.hour - b.hour);
}

export function formatTimeSlot(slot: TimeSlot): string {
  // UTC → JST表示
  const jstHour = (slot.hour + JST_OFFSET) % 24;
  return `${String(jstHour).padStart(2, "0")}:${String(slot.minute).padStart(2, "0")}`;
}
// Mon Mar 16 10:18:06 UTC 2026
