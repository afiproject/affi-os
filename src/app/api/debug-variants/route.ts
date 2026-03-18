import { NextResponse } from "next/server";
import { getAdminClient, isDemoMode } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isDemoMode()) {
    return NextResponse.json({ error: "Demo mode" });
  }

  const db = getAdminClient();

  // 全variantの数
  const { count: totalVariants } = await db
    .from("candidate_post_variants")
    .select("*", { count: "exact", head: true });

  // 各ステータス別のcandidate数
  const { data: statusCounts } = await db
    .from("candidate_posts")
    .select("status");

  const counts: Record<string, number> = {};
  for (const row of statusCounts || []) {
    counts[row.status] = (counts[row.status] || 0) + 1;
  }

  // pending候補のvariant有無を確認
  const { data: pendingWithVariants } = await db
    .from("candidate_posts")
    .select(`
      id,
      total_score,
      status,
      variants:candidate_post_variants(id, body_text, tone, is_selected)
    `)
    .eq("status", "pending")
    .order("total_score", { ascending: false })
    .limit(10);

  // approved候補のvariant有無
  const { data: approvedWithVariants } = await db
    .from("candidate_posts")
    .select(`
      id,
      total_score,
      status,
      variants:candidate_post_variants(id, body_text, tone, is_selected)
    `)
    .eq("status", "approved")
    .order("total_score", { ascending: false })
    .limit(5);

  // variant数が0のpending候補の数
  const pendingSummary = (pendingWithVariants || []).map((c) => ({
    id: c.id.substring(0, 8),
    score: c.total_score,
    variant_count: (c.variants as unknown[])?.length || 0,
    has_text: (c.variants as { body_text: string }[])?.some(v => v.body_text && v.body_text.length > 0) || false,
  }));

  const approvedSummary = (approvedWithVariants || []).map((c) => ({
    id: c.id.substring(0, 8),
    score: c.total_score,
    variant_count: (c.variants as unknown[])?.length || 0,
    has_text: (c.variants as { body_text: string }[])?.some(v => v.body_text && v.body_text.length > 0) || false,
  }));

  return NextResponse.json({
    total_variants_in_db: totalVariants,
    candidate_counts: counts,
    top_10_pending: pendingSummary,
    top_5_approved: approvedSummary,
  });
}
