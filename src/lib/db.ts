// ========================================
// Database Operations Module
// 全テーブルのCRUD操作を集約
// ========================================

import { getAdminClient } from "@/lib/supabase/admin";
import type {
  AffiliateItem,
  AffiliateSource,
  CandidatePost,
  CandidatePostVariant,
  ScheduledPost,
  PostedLog,
  PerformanceMetric,
  SystemSettings,
  AccountSettings,
  ContentRule,
  WorkflowLog,
  Account,
} from "@/types";

// Supabase未型付きDBのヘルパー
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

// ==========================================
// Affiliate Sources
// ==========================================

export async function getActiveSources(): Promise<AffiliateSource[]> {
  const db = getAdminClient();
  const { data, error } = await db
    .from("affiliate_sources")
    .select("*")
    .eq("is_active", true);
  if (error) throw error;
  return data || [];
}

// ==========================================
// Affiliate Items
// ==========================================

export async function upsertItems(items: Omit<AffiliateItem, "id" | "collected_at">[]): Promise<number> {
  const db = getAdminClient();
  const rows = items.map((item) => ({
    source_id: item.source_id,
    external_id: item.external_id,
    title: item.title,
    description: item.description,
    category: item.category,
    tags: item.tags,
    thumbnail_url: item.thumbnail_url,
    sample_video_url: item.sample_video_url,
    affiliate_url: item.affiliate_url,
    is_free_trial: item.is_free_trial,
    popularity_score: item.popularity_score,
    freshness_score: item.freshness_score,
    is_excluded: item.is_excluded,
    exclusion_reason: item.exclusion_reason,
  })) as AnyRecord[];
  const { data, error } = await db
    .from("affiliate_items")
    .upsert(rows, { onConflict: "source_id,external_id" })
    .select("id");
  if (error) throw error;
  return data?.length || 0;
}

export async function getRecentItems(limit: number = 50): Promise<AffiliateItem[]> {
  const db = getAdminClient();
  const { data, error } = await db
    .from("affiliate_items")
    .select("*")
    .eq("is_excluded", false)
    .order("collected_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function getUnscoredItems(): Promise<AffiliateItem[]> {
  const db = getAdminClient();
  // 今日収集されたもので、まだcandidateが作られていないアイテム
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 投稿済みアイテムのitem_idを取得（posted_logs → scheduled_posts → candidate_posts → affiliate_items）
  const { data: postedItems } = await db
    .from("posted_logs")
    .select("scheduled_post:scheduled_posts(candidate:candidate_posts(item_id))");
  const postedItemIds = new Set(
    (postedItems || [])
      .map((p: AnyRecord) => p.scheduled_post?.candidate?.item_id)
      .filter(Boolean)
  );

  const { data, error } = await db
    .from("affiliate_items")
    .select("*, candidate_posts(id)")
    .eq("is_excluded", false)
    .gte("collected_at", today.toISOString())
    .order("collected_at", { ascending: false });
  if (error) throw error;
  // candidate_postsが空 かつ 投稿済みでないものだけ返す
  return (data || []).filter(
    (item: AffiliateItem & { candidate_posts: { id: string }[] }) =>
      (!item.candidate_posts || item.candidate_posts.length === 0) &&
      !postedItemIds.has(item.id)
  );
}

export async function getItemById(id: string): Promise<AffiliateItem | null> {
  const db = getAdminClient();
  const { data, error } = await db
    .from("affiliate_items")
    .select("*")
    .eq("id", id)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data;
}

// ==========================================
// Accounts
// ==========================================

export async function getActiveAccounts(): Promise<Account[]> {
  const db = getAdminClient();
  const { data, error } = await db
    .from("accounts")
    .select("*")
    .eq("is_active", true);
  if (error) throw error;
  return data || [];
}

export async function getFirstActiveAccount(): Promise<Account | null> {
  const db = getAdminClient();
  const { data, error } = await db
    .from("accounts")
    .select("*")
    .eq("is_active", true)
    .limit(1)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data;
}

// ==========================================
// Candidate Posts
// ==========================================

export async function getCandidates(
  filters?: { status?: string; accountId?: string }
): Promise<CandidatePost[]> {
  const db = getAdminClient();
  let query = db
    .from("candidate_posts")
    .select(`
      *,
      item:affiliate_items(*),
      variants:candidate_post_variants(*)
    `)
    .order("total_score", { ascending: false });

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }
  if (filters?.accountId) {
    query = query.eq("account_id", filters.accountId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(mapCandidate);
}

export async function createCandidate(
  candidate: Omit<CandidatePost, "id" | "item" | "variants" | "created_at" | "updated_at">
): Promise<string> {
  const db = getAdminClient();
  const { data, error } = await db
    .from("candidate_posts")
    .insert({
      item_id: candidate.item_id,
      account_id: candidate.account_id,
      status: candidate.status,
      ai_score: candidate.ai_score,
      freshness_score: candidate.freshness_score,
      popularity_score: candidate.popularity_score,
      free_trial_score: candidate.free_trial_score,
      historical_ctr_score: candidate.historical_ctr_score,
      time_fitness_score: candidate.time_fitness_score,
      duplicate_risk_score: candidate.duplicate_risk_score,
      safety_score: candidate.safety_score,
      total_score: candidate.total_score,
      estimated_ctr: candidate.estimated_ctr,
      recommended_time: candidate.recommended_time,
      recommendation_reason: candidate.recommendation_reason,
      risk_flags: candidate.risk_flags,
      has_alternative: candidate.has_alternative,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data!.id;
}

export async function updateCandidateStatus(
  id: string,
  status: string
): Promise<void> {
  const db = getAdminClient();
  const { error } = await db
    .from("candidate_posts")
    .update({ status })
    .eq("id", id);
  if (error) throw error;
}

export async function getTopCandidatesForGeneration(limit: number = 20): Promise<CandidatePost[]> {
  const db = getAdminClient();
  // デモ/空のvariantsを先に削除（body_textが空またはデモテキストのもの）
  await db
    .from("candidate_post_variants")
    .delete()
    .or("body_text.is.null,body_text.eq.,body_text.like.[デモ]%");

  // バリアントなしのapproved候補をpendingに戻す + 関連scheduled_postsも削除
  const { data: allCandidates } = await db
    .from("candidate_posts")
    .select("id, status, variants:candidate_post_variants(id)")
    .in("status", ["approved", "pending", "scored"]);
  if (allCandidates) {
    const approvedNoVariantIds = allCandidates
      .filter((c: AnyRecord) =>
        c.status === "approved" &&
        (!c.variants || (c.variants as AnyRecord[]).length === 0)
      )
      .map((c: AnyRecord) => c.id as string);
    if (approvedNoVariantIds.length > 0) {
      await db
        .from("scheduled_posts")
        .delete()
        .in("candidate_id", approvedNoVariantIds);
      await db
        .from("candidate_posts")
        .update({ status: "pending" })
        .in("id", approvedNoVariantIds);
      console.log(`[generate] Reset ${approvedNoVariantIds.length} orphaned approved candidates to pending`);
    }
  }

  // variantがないcandidateを取得（posted済みチェックは省略 — 再投稿防止はpost時に行う）
  const { data, error } = await db
    .from("candidate_posts")
    .select(`
      *,
      item:affiliate_items(*),
      variants:candidate_post_variants(id)
    `)
    .in("status", ["pending", "scored"])
    .order("total_score", { ascending: false })
    .limit(limit * 2);
  if (error) throw error;
  return (data || [])
    .filter((c: CandidatePost & { variants: { id: string }[] }) =>
      !c.variants || c.variants.length === 0
    )
    .map(mapCandidate)
    .slice(0, limit);
}

// ==========================================
// Candidate Post Variants
// ==========================================

export async function createVariant(
  variant: Omit<CandidatePostVariant, "id" | "created_at">
): Promise<string> {
  const db = getAdminClient();
  const { data, error } = await db
    .from("candidate_post_variants")
    .insert({
      candidate_id: variant.candidate_id,
      variant_label: variant.variant_label,
      body_text: variant.body_text,
      tone: variant.tone,
      length: variant.length,
      hashtags: variant.hashtags,
      is_selected: variant.is_selected,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data!.id;
}

// ==========================================
// Scheduled Posts
// ==========================================

export async function getScheduledPosts(
  filters?: { status?: string; accountId?: string }
): Promise<ScheduledPost[]> {
  const db = getAdminClient();
  let query = db
    .from("scheduled_posts")
    .select(`
      *,
      candidate:candidate_posts(
        *,
        item:affiliate_items(*),
        variants:candidate_post_variants(*)
      )
    `)
    .order("scheduled_at", { ascending: true });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.accountId) {
    query = query.eq("account_id", filters.accountId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(mapScheduledPost);
}

export async function getDuePosts(): Promise<ScheduledPost[]> {
  const db = getAdminClient();
  const now = new Date().toISOString();
  const { data, error } = await db
    .from("scheduled_posts")
    .select(`
      *,
      candidate:candidate_posts(
        *,
        item:affiliate_items(*),
        variants:candidate_post_variants(*)
      )
    `)
    .eq("status", "scheduled")
    .lte("scheduled_at", now)
    .order("scheduled_at", { ascending: true });
  if (error) throw error;
  return (data || []).map(mapScheduledPost);
}

export async function createScheduledPost(post: {
  candidate_id: string;
  account_id: string;
  variant_id?: string;
  scheduled_at: string;
  post_mode?: string;
  custom_body_text?: string;
}): Promise<string> {
  const db = getAdminClient();
  const insertData: Record<string, unknown> = {
    candidate_id: post.candidate_id,
    account_id: post.account_id,
    scheduled_at: post.scheduled_at,
    status: "scheduled",
    post_mode: post.post_mode || "A",
    custom_body_text: post.custom_body_text || null,
  };
  if (post.variant_id) {
    insertData.variant_id = post.variant_id;
  }
  const { data, error } = await db
    .from("scheduled_posts")
    .insert(insertData)
    .select("id")
    .single();
  if (error) throw error;
  return data!.id;
}

export async function updateScheduledPostStatus(
  id: string,
  updates: {
    status: string;
    posted_at?: string;
    external_post_id?: string;
    reply_post_id?: string;
    error_message?: string;
    retry_count?: number;
  }
): Promise<void> {
  const db = getAdminClient();
  const { error } = await db
    .from("scheduled_posts")
    .update(updates)
    .eq("id", id);
  if (error) throw error;
}

export async function getTodayScheduledCount(accountId: string): Promise<number> {
  const db = getAdminClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const { count, error } = await db
    .from("scheduled_posts")
    .select("id", { count: "exact", head: true })
    .eq("account_id", accountId)
    .in("status", ["scheduled", "posted"])
    .gte("scheduled_at", today.toISOString())
    .lt("scheduled_at", tomorrow.toISOString());
  if (error) throw error;
  return count || 0;
}

// ==========================================
// Posted Logs
// ==========================================

export async function createPostedLog(log: Omit<PostedLog, "id">): Promise<string> {
  const db = getAdminClient();
  const { data, error } = await db
    .from("posted_logs")
    .insert(log)
    .select("id")
    .single();
  if (error) throw error;
  return data!.id;
}

export async function getRecentPostedLogs(limit: number = 50): Promise<PostedLog[]> {
  const db = getAdminClient();
  const { data, error } = await db
    .from("posted_logs")
    .select("*")
    .order("posted_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

// ==========================================
// Performance Metrics
// ==========================================

export async function upsertPerformanceMetric(
  metric: Omit<PerformanceMetric, "id" | "collected_at">
): Promise<void> {
  const db = getAdminClient();
  const { error } = await db
    .from("performance_metrics")
    .upsert(metric, { onConflict: "posted_log_id,date" });
  // If unique constraint doesn't exist on (posted_log_id, date), just insert
  if (error && error.code === "23505") return;
  if (error) throw error;
}

export async function getDailyAnalytics(days: number = 14) {
  const db = getAdminClient();
  const since = new Date();
  since.setDate(since.getDate() - days);
  const { data, error } = await db
    .from("performance_metrics")
    .select("date, impressions, clicks, ctr, conversions")
    .gte("date", since.toISOString().split("T")[0])
    .order("date", { ascending: true });
  if (error) throw error;

  // 日ごとに集計
  const byDate = new Map<string, { clicks: number; impressions: number; conversions: number; count: number }>();
  for (const row of data || []) {
    const existing = byDate.get(row.date) || { clicks: 0, impressions: 0, conversions: 0, count: 0 };
    existing.clicks += row.clicks;
    existing.impressions += row.impressions;
    existing.conversions += row.conversions;
    existing.count++;
    byDate.set(row.date, existing);
  }

  return Array.from(byDate.entries()).map(([date, stats]) => ({
    date,
    clicks: stats.clicks,
    impressions: stats.impressions,
    ctr: stats.impressions > 0 ? parseFloat(((stats.clicks / stats.impressions) * 100).toFixed(2)) : 0,
    posts_count: stats.count,
    approved_count: stats.count,
    rejected_count: 0,
  }));
}

export async function getCategoryAnalytics() {
  const db = getAdminClient();
  const { data, error } = await db
    .from("posted_logs")
    .select(`
      category,
      performance_metrics(clicks, impressions, ctr, conversions)
    `);
  if (error) throw error;

  const byCategory = new Map<string, { posts: number; clicks: number; ctr_sum: number; conversions: number }>();
  for (const row of data || []) {
    const cat = row.category || "other";
    const existing = byCategory.get(cat) || { posts: 0, clicks: 0, ctr_sum: 0, conversions: 0 };
    existing.posts++;
    const metrics = (row as unknown as { performance_metrics: PerformanceMetric[] }).performance_metrics || [];
    for (const m of metrics) {
      existing.clicks += m.clicks;
      existing.ctr_sum += m.ctr;
      existing.conversions += m.conversions;
    }
    byCategory.set(cat, existing);
  }

  return Array.from(byCategory.entries()).map(([category, stats]) => ({
    category,
    total_posts: stats.posts,
    total_clicks: stats.clicks,
    avg_ctr: stats.posts > 0 ? parseFloat((stats.ctr_sum / stats.posts).toFixed(2)) : 0,
    total_conversions: stats.conversions,
  }));
}

export async function getHourlyAnalytics() {
  const db = getAdminClient();
  const { data, error } = await db
    .from("posted_logs")
    .select(`
      posted_at,
      performance_metrics(clicks, ctr)
    `);
  if (error) throw error;

  const byHour = new Map<number, { clicks: number; ctr_sum: number; count: number }>();
  for (let h = 0; h < 24; h++) {
    byHour.set(h, { clicks: 0, ctr_sum: 0, count: 0 });
  }
  for (const row of data || []) {
    const hour = new Date(row.posted_at).getHours();
    const existing = byHour.get(hour)!;
    existing.count++;
    const metrics = (row as unknown as { performance_metrics: PerformanceMetric[] }).performance_metrics || [];
    for (const m of metrics) {
      existing.clicks += m.clicks;
      existing.ctr_sum += m.ctr;
    }
  }

  return Array.from(byHour.entries()).map(([hour, stats]) => ({
    hour,
    avg_clicks: stats.count > 0 ? Math.round(stats.clicks / stats.count) : 0,
    avg_ctr: stats.count > 0 ? parseFloat((stats.ctr_sum / stats.count).toFixed(2)) : 0,
    post_count: stats.count,
  }));
}

export async function getToneAnalytics() {
  const db = getAdminClient();
  const { data, error } = await db
    .from("posted_logs")
    .select(`
      tone,
      performance_metrics(clicks, ctr)
    `);
  if (error) throw error;

  const byTone = new Map<string, { clicks: number; ctr_sum: number; count: number }>();
  for (const row of data || []) {
    const tone = row.tone || "natural";
    const existing = byTone.get(tone) || { clicks: 0, ctr_sum: 0, count: 0 };
    existing.count++;
    const metrics = (row as unknown as { performance_metrics: PerformanceMetric[] }).performance_metrics || [];
    for (const m of metrics) {
      existing.clicks += m.clicks;
      existing.ctr_sum += m.ctr;
    }
    byTone.set(tone, existing);
  }

  return Array.from(byTone.entries()).map(([tone, stats]) => ({
    tone,
    total_posts: stats.count,
    avg_ctr: stats.count > 0 ? parseFloat((stats.ctr_sum / stats.count).toFixed(2)) : 0,
    avg_clicks: stats.count > 0 ? Math.round(stats.clicks / stats.count) : 0,
  }));
}

// ==========================================
// Settings
// ==========================================

export async function getSystemSettings(): Promise<SystemSettings | null> {
  const db = getAdminClient();
  const { data, error } = await db
    .from("system_settings")
    .select("*")
    .limit(1)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function updateSystemSettings(
  id: string,
  updates: Partial<SystemSettings>
): Promise<void> {
  const db = getAdminClient();
  const { error } = await db
    .from("system_settings")
    .update(updates)
    .eq("id", id);
  if (error) throw error;
}

export async function getAccountSettings(accountId: string): Promise<AccountSettings | null> {
  const db = getAdminClient();
  const { data, error } = await db
    .from("account_settings")
    .select("*")
    .eq("account_id", accountId)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function updateAccountSettings(
  id: string,
  updates: Partial<AccountSettings>
): Promise<void> {
  const db = getAdminClient();
  const { error } = await db
    .from("account_settings")
    .update(updates)
    .eq("id", id);
  if (error) throw error;
}

export async function getContentRules(): Promise<ContentRule[]> {
  const db = getAdminClient();
  const { data, error } = await db
    .from("content_rules")
    .select("*")
    .eq("is_active", true);
  if (error) throw error;
  return data || [];
}

// ==========================================
// Workflow Logs
// ==========================================

export async function startWorkflow(type: string): Promise<string> {
  const db = getAdminClient();
  const { data, error } = await db
    .from("workflow_logs")
    .insert({ workflow_type: type, status: "started" })
    .select("id")
    .single();
  if (error) throw error;
  return data!.id;
}

export async function completeWorkflow(
  id: string,
  itemsProcessed: number,
  errorMessage?: string
): Promise<void> {
  const db = getAdminClient();
  const { error } = await db
    .from("workflow_logs")
    .update({
      status: errorMessage ? "failed" : "completed",
      items_processed: itemsProcessed,
      error_message: errorMessage,
      completed_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
}

export async function getRecentWorkflows(limit: number = 10): Promise<WorkflowLog[]> {
  const db = getAdminClient();
  const { data, error } = await db
    .from("workflow_logs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

// ==========================================
// Approval Logs
// ==========================================

export async function createApprovalLog(log: {
  candidate_id: string;
  action: string;
  note?: string;
}): Promise<void> {
  const db = getAdminClient();
  const { error } = await db.from("approval_logs").insert(log);
  if (error) throw error;
}

// ==========================================
// Error Logs
// ==========================================

export async function logError(
  source: string,
  message: string,
  stack?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const db = getAdminClient();
    await db.from("error_logs").insert({ source, message, stack, metadata });
  } catch {
    console.error("Failed to log error:", source, message);
  }
}

// ==========================================
// AI Generation Logs
// ==========================================

export async function createAILog(log: {
  candidate_id?: string;
  prompt_type: string;
  provider: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  duration_ms: number;
  success: boolean;
  error_message?: string;
}): Promise<void> {
  const db = getAdminClient();
  const { error } = await db.from("ai_generation_logs").insert(log);
  if (error) console.error("Failed to log AI generation:", error);
}

// ==========================================
// Helpers
// ==========================================

function mapCandidate(row: Record<string, unknown>): CandidatePost {
  return {
    ...row,
    item: row.item as AffiliateItem,
    variants: (row.variants as CandidatePostVariant[]) || [],
    risk_flags: (row.risk_flags as CandidatePost["risk_flags"]) || [],
  } as CandidatePost;
}

function mapScheduledPost(row: Record<string, unknown>): ScheduledPost {
  const candidate = row.candidate as Record<string, unknown>;
  const mappedCandidate = candidate ? mapCandidate(candidate) : undefined;
  // variant_idがある場合、candidateのvariantsから該当バリアントを取得
  const variantId = row.variant_id as string | null;
  const variant = variantId && mappedCandidate?.variants
    ? mappedCandidate.variants.find((v) => v.id === variantId) || null
    : null;
  return {
    ...row,
    candidate: mappedCandidate,
    variant: variant as CandidatePostVariant,
  } as unknown as ScheduledPost;
}

// ==========================================
// Video Cache
// ==========================================

/** sample_video_urlがあるがcached_video_urlがないアイテムを取得 */
export async function getItemsNeedingVideoCache(limit: number = 10): Promise<AffiliateItem[]> {
  const db = getAdminClient();
  const { data, error } = await db
    .from("affiliate_items")
    .select("*")
    .eq("is_excluded", false)
    .not("sample_video_url", "is", null)
    .not("sample_video_url", "eq", "")
    .or("cached_video_url.is.null,cached_video_url.eq.")
    .order("collected_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

/** キャッシュ済み動画URLを更新 */
export async function updateCachedVideoUrl(itemId: string, cachedUrl: string): Promise<void> {
  const db = getAdminClient();
  const { error } = await db
    .from("affiliate_items")
    .update({ cached_video_url: cachedUrl })
    .eq("id", itemId);
  if (error) throw error;
}

// カテゴリ別の平均CTRを取得（スコアリング用）
export async function getCategoryAvgCtr(): Promise<Record<string, number>> {
  const db = getAdminClient();
  const { data, error } = await db
    .from("posted_logs")
    .select("category, performance_metrics(ctr)");
  if (error) throw error;

  const byCategory = new Map<string, { sum: number; count: number }>();
  for (const row of data || []) {
    const cat = row.category || "other";
    const existing = byCategory.get(cat) || { sum: 0, count: 0 };
    const metrics = (row as unknown as { performance_metrics: { ctr: number }[] }).performance_metrics || [];
    for (const m of metrics) {
      existing.sum += m.ctr;
      existing.count++;
    }
    byCategory.set(cat, existing);
  }

  const result: Record<string, number> = {};
  for (const [cat, stats] of byCategory) {
    result[cat] = stats.count > 0 ? stats.sum / stats.count : 0;
  }
  return result;
}

/**
 * タグ別の平均パフォーマンスを取得（いいね+RT数ベース）
 * 過去の投稿で反応が良かったタグほど高スコアを返す
 */
export async function getTagPerformance(): Promise<Record<string, number>> {
  const db = getAdminClient();
  const { data, error } = await db
    .from("posted_logs")
    .select("tags, performance_metrics(likes, retweets, impressions)");
  if (error) throw error;

  const byTag = new Map<string, { totalScore: number; count: number }>();
  for (const row of data || []) {
    const tags = (row.tags as string[]) || [];
    const metrics = (row as unknown as { performance_metrics: { likes: number; retweets: number; impressions: number }[] }).performance_metrics || [];
    if (metrics.length === 0) continue;

    // エンゲージメントスコア = likes + retweets * 2
    let engagementScore = 0;
    for (const m of metrics) {
      engagementScore += (m.likes || 0) + (m.retweets || 0) * 2;
    }
    const avgScore = engagementScore / metrics.length;

    for (const tag of tags) {
      const existing = byTag.get(tag) || { totalScore: 0, count: 0 };
      existing.totalScore += avgScore;
      existing.count++;
      byTag.set(tag, existing);
    }
  }

  const result: Record<string, number> = {};
  for (const [tag, stats] of byTag) {
    result[tag] = stats.count > 0 ? stats.totalScore / stats.count : 0;
  }
  return result;
}

// 最近投稿したカテゴリを取得（重複判定用）
export async function getRecentPostedCategories(days: number = 7): Promise<string[]> {
  const db = getAdminClient();
  const since = new Date();
  since.setDate(since.getDate() - days);
  const { data, error } = await db
    .from("posted_logs")
    .select("category")
    .gte("posted_at", since.toISOString());
  if (error) throw error;
  return (data || []).map((r) => r.category);
}

// ==========================================
// Noimos AI CSV Imports
// ==========================================

export async function createNoimosImport(params: {
  filename: string;
  source?: string;
  rows_total: number;
}): Promise<string> {
  const db = getAdminClient();
  const { data, error } = await db
    .from("noimos_imports")
    .insert({
      filename: params.filename,
      source: params.source || "noimos_csv",
      rows_total: params.rows_total,
      status: "processing",
    })
    .select("id")
    .single();
  if (error) throw error;
  return data!.id;
}

export async function updateNoimosImport(id: string, updates: {
  rows_processed?: number;
  rows_failed?: number;
  status?: string;
  error_message?: string;
}): Promise<void> {
  const db = getAdminClient();
  const { error } = await db.from("noimos_imports").update(updates).eq("id", id);
  if (error) throw error;
}

export async function createNoimosImportRow(row: {
  import_id: string;
  row_number: number;
  scheduled_time: string;
  body_text: string;
  hashtags?: string[];
  video_url?: string;
  thumbnail_url?: string;
  affiliate_url?: string;
  category?: string;
  tags?: string[];
  post_mode?: string;
  metadata?: Record<string, unknown>;
}): Promise<string> {
  const db = getAdminClient();
  const { data, error } = await db
    .from("noimos_import_rows")
    .insert({
      import_id: row.import_id,
      row_number: row.row_number,
      scheduled_time: row.scheduled_time,
      body_text: row.body_text,
      hashtags: row.hashtags || [],
      video_url: row.video_url || "",
      thumbnail_url: row.thumbnail_url || "",
      affiliate_url: row.affiliate_url || "",
      category: row.category || "",
      tags: row.tags || [],
      post_mode: row.post_mode || "A",
      status: "pending",
      metadata: row.metadata || {},
    })
    .select("id")
    .single();
  if (error) throw error;
  return data!.id;
}

export async function updateNoimosImportRow(id: string, updates: {
  status?: string;
  scheduled_post_id?: string;
  error_message?: string;
}): Promise<void> {
  const db = getAdminClient();
  const { error } = await db.from("noimos_import_rows").update(updates).eq("id", id);
  if (error) throw error;
}

export async function getNoimosImports(limit: number = 20): Promise<AnyRecord[]> {
  const db = getAdminClient();
  const { data, error } = await db
    .from("noimos_imports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function getNoimosImportRows(importId: string): Promise<AnyRecord[]> {
  const db = getAdminClient();
  const { data, error } = await db
    .from("noimos_import_rows")
    .select("*")
    .eq("import_id", importId)
    .order("row_number", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getPendingNoimosRows(): Promise<AnyRecord[]> {
  const db = getAdminClient();
  const { data, error } = await db
    .from("noimos_import_rows")
    .select("*")
    .eq("status", "pending")
    .order("scheduled_time", { ascending: true });
  if (error) throw error;
  return data || [];
}
