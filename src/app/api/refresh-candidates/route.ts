import { NextResponse } from "next/server";
import { GET as collectHandler } from "@/app/api/cron/collect/route";
import { GET as scoreHandler } from "@/app/api/cron/score/route";
import { GET as generateHandler } from "@/app/api/cron/generate/route";

export const maxDuration = 120;
export const preferredRegion = ["hnd1"];

/**
 * POST /api/refresh-candidates — 投稿候補を手動更新
 * collect → score → generate を順番に実行（自動投稿はしない）
 */
export async function POST(request: Request) {
  const results: Record<string, unknown> = {};
  const start = Date.now();

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

  // Step 3: Generate
  try {
    const res = await generateHandler(internalRequest);
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
