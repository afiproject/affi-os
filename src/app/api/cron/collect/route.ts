import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/supabase/admin";
import { createAffiliateSource } from "@/lib/adapters/affiliate-source";
import {
  upsertItems,
  getActiveSources,
  getContentRules,
  startWorkflow,
  completeWorkflow,
  logError,
} from "@/lib/db";

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

    if (sources.length === 0) {
      const adapter = createAffiliateSource();
      const items = await adapter.fetchItems({ sortBy: "newest", limit: 20 });
      totalCollected = await upsertItems(items);
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
    await completeWorkflow(workflowId, 0, String(error));
    await logError("cron/collect", String(error));
    return NextResponse.json(
      { error: "Collection failed", details: String(error) },
      { status: 500 }
    );
  }
}
