import { NextResponse } from "next/server";
import { GET as collectHandler } from "@/app/api/cron/collect/route";
import { GET as scoreHandler } from "@/app/api/cron/score/route";
import { GET as generateHandler } from "@/app/api/cron/generate/route";
import { clearPendingCandidates } from "@/lib/db";

export const maxDuration = 300;
export const preferredRegion = ["hnd1"];

/**
 * POST /api/refresh-candidates — 投稿候補を手動更新
 * pending候補を全削除 → collect → score → generate を順番に実行
 */
export async function POST(request: Request) {
  const results: Record<string, unknown> = {};
  const start = Date.now();

  // Step 0: 古いpending候補を全削除（投稿済み・却下済みは保持）
  try {
    const cleared = await clearPendingCandidates();
    results.cleared = { pending_deleted: cleared };
    console.log(`[refresh] cleared ${cleared} pending candidates`);
  } catch (e) {
    results.cleared = { error: String(e) };
    console.error("[refresh] clear failed:", e);
  }

  // CRONと同じ認証ヘッダーを内部リクエストに付与
  const internalRequest = new Request(request.url, {
    headers: new Headers({
      authorization: `Bearer ${process.env.CRON_SECRET || ""}`,
    }),
  });

  // Step 1: Collect
  try {
    const res = await collectHandler(internalRequest);
    results.collect = await res.json();
    console.log("[refresh] collect done:", JSON.stringify(results.collect));
  } catch (e) {
    results.collect = { error: String(e) };
    console.error("[refresh] collect failed:", e);
  }

  // Step 2: Score
  try {
    const res = await scoreHandler(internalRequest);
    results.score = await res.json();
    console.log("[refresh] score done:", JSON.stringify(results.score));
  } catch (e) {
    results.score = { error: String(e) };
    console.error("[refresh] score failed:", e);
  }

  // Step 3: Generate（デフォルト1トーン: 上位5件 = 5APIコール）
  try {
    const baseUrl = new URL(request.url);
    baseUrl.searchParams.set("limit", "5");
    const generateRequest = new Request(baseUrl.toString(), {
      headers: new Headers({
        authorization: `Bearer ${process.env.CRON_SECRET || ""}`,
      }),
    });
    const res = await generateHandler(generateRequest);
    results.generate = await res.json();
    console.log("[refresh] generate done:", JSON.stringify(results.generate));
  } catch (e) {
    results.generate = { error: String(e) };
    console.error("[refresh] generate failed:", e);
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`[refresh] completed in ${elapsed}s`);

  return NextResponse.json({
    success: true,
    elapsed_seconds: Number(elapsed),
    results,
  });
}
