// AI提案レイヤー（ルールベース。将来LLM差し替え可能）
import { DEMO_POIS, MEETUP_PLACES } from "./demo-data";

export type MeetupSuggestion = {
  place: string;
  reason: string;
  message: string;
};

/**
 * 待ち合わせ候補を3件提案（公共・わかりやすい・安全を優先）
 */
export function suggestMeetups(
  mode: "call" | "in_person",
  purpose: string,
  durationMinutes: number,
): MeetupSuggestion[] {
  if (mode === "call") {
    return [{
      place: "オンライン通話",
      reason: "通話モードなので場所不要です",
      message: `今から${durationMinutes}分、通話しませんか？`,
    }];
  }

  // 対面: POIから3件選ぶ（公共優先）
  const sorted = [...DEMO_POIS].sort((a, b) => {
    const order: Record<string, number> = { "公共": 0, "カフェ": 1, "商業施設": 2, "公園": 3 };
    return (order[a.category] ?? 9) - (order[b.category] ?? 9);
  });

  return sorted.slice(0, 3).map((poi) => ({
    place: poi.name,
    reason: poi.note,
    message: `今から${durationMinutes}分、${poi.name}で${purpose}しませんか？（${poi.note}）`,
  }));
}

/**
 * 初手メッセージ生成（集合地点を埋め込む）
 */
export function generateFirstMessage(
  targetName: string,
  place: string,
  durationMinutes: number,
  purpose: string,
): string {
  return `${targetName}さん、今から${durationMinutes}分${purpose}しませんか？${place}でどうですか？`;
}
