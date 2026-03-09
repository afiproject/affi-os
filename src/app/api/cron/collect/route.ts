import { NextResponse } from "next/server";
import { isDemoMode, getAdminClient } from "@/lib/supabase/admin";
import { createAffiliateSource } from "@/lib/adapters/affiliate-source";
import {
  upsertItems,
  getActiveSources,
  getContentRules,
  startWorkflow,
  completeWorkflow,
  logError,
} from "@/lib/db";

// デフォルトのaffiliate_sourceを取得または作成
async function getOrCreateDefaultSource(): Promise<string> {
  const db = getAdminClient();
  const { data: existing } = await db
    .from("affiliate_sources")
    .select("id")
    .eq("type", "demo")
    .limit(1)
    .single();

  if (existing) return existing.id;

  const { data: created, error } = await db
    .from("affiliate_sources")
    .insert({ name: "デモ素材", type: "demo", base_url: "", is_active: true })
    .select("id")
    .single();

  if (error) throw error;
  return created!.id;
}

// GET /api/cron/collect — 素材収集ジョブ
// Vercel Cron: 毎日6時に実行
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isDemoMode()) {
    const source = createAffiliateSource();
    const items = await source.fetchItems({ sortBy: "newest", limit: 20 });
    return NextResponse.json({
      success: true,
      workflow: "collect",
      items_collected: items.length,
      timestamp: new Date().toISOString(),
    });
  }

  const workflowId = await startWorkflow("collect");

  try {
    const sources = await getActiveSources();
    const ngRules = await getContentRules();
    const ngCategories = ngRules
      .filter((r) => r.rule_type === "ng_category")
      .map((r) => r.value);

    let totalCollected = 0;

    for (const dbSource of sources) {
      const adapter = createAffiliateSource(dbSource.type);
      const items = await adapter.fetchItems({ sortBy: "newest", limit: 30 });

      const filtered = items.map((item) => ({
        ...item,
        source_id: dbSource.id,
        is_excluded: ngCategories.includes(item.category),
        exclusion_reason: ngCategories.includes(item.category) ? "NGカテゴリ" : undefined,
      }));

      const count = await upsertItems(filtered);
      totalCollected += count;
    }

    // ソースが0件の場合、デフォルトソースを作成してデモデータを投入
    if (sources.length === 0) {
      const defaultSourceId = await getOrCreateDefaultSource();
      const adapter = createAffiliateSource();
      const items = await adapter.fetchItems({ sortBy: "newest", limit: 20 });

      const itemsWithSource = items.map((item) => ({
        ...item,
        source_id: defaultSourceId,
      }));

      totalCollected = await upsertItems(itemsWithSource);
    }

    await completeWorkflow(workflowId, totalCollected);

    return NextResponse.json({
      success: true,
      workflow: "collect",
      sources_count: sources.length,
      items_collected: totalCollected,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : JSON.stringify(error);
    await completeWorkflow(workflowId, 0, errMsg).catch(() => {});
    await logError("cron/collect", errMsg).catch(() => {});
    return NextResponse.json(
      { error: "Collection failed", details: errMsg },
      { status: 500 }
    );
  }
}
