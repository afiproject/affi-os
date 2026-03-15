import { NextResponse } from "next/server";

export const maxDuration = 120;
export const preferredRegion = ["hnd1"];

/**
 * GET /api/cron/pipeline — 全パイプライン一括実行
 * collect → score → generate を順番に実行
 * 投稿候補を一気に補充したい時に使う
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const baseUrl = new URL(request.url).origin;
  const headers = { Authorization: `Bearer ${process.env.CRON_SECRET}` };

  const results: Record<string, unknown> = {};

  // Step 1: Collect
  try {
    const collectRes = await fetch(`${baseUrl}/api/cron/collect`, { headers });
    results.collect = await collectRes.json();
    console.log("[pipeline] collect done:", JSON.stringify(results.collect));
  } catch (e) {
    results.collect = { error: String(e) };
  }

  // Step 2: Score
  try {
    const scoreRes = await fetch(`${baseUrl}/api/cron/score`, { headers });
    results.score = await scoreRes.json();
    console.log("[pipeline] score done:", JSON.stringify(results.score));
  } catch (e) {
    results.score = { error: String(e) };
  }

  // Step 3: Generate
  try {
    const generateRes = await fetch(`${baseUrl}/api/cron/generate`, { headers });
    results.generate = await generateRes.json();
    console.log("[pipeline] generate done:", JSON.stringify(results.generate));
  } catch (e) {
    results.generate = { error: String(e) };
  }

  return NextResponse.json({
    success: true,
    workflow: "pipeline",
    results,
    timestamp: new Date().toISOString(),
  });
}
