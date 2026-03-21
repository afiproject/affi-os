import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/supabase/admin";
import { createAIProvider } from "@/lib/adapters/ai-provider";
import { buildPostGenerationPrompt, buildHashtagPrompt } from "@/lib/prompts/post-generation";
import {
  getTopCandidatesForGeneration,
  createVariant,
  getContentRules,
  getAccountSettings,
  getFirstActiveAccount,
  createAILog,
  startWorkflow,
  completeWorkflow,
  logError,
  getSystemSettings,
  createScheduledPost,
  getScheduledPosts,
  updateCandidateStatus,
} from "@/lib/db";
import { findOptimalTimeSlots } from "@/lib/services/scheduler";
import { demoItems } from "@/lib/demo-data";

// GET /api/cron/generate — 文面生成ジョブ
// Vercel Cron: 毎日8時に実行
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isDemoMode()) {
    const provider = createAIProvider();
    const tones = ["click_bait", "natural", "casual"] as const;
    let generatedCount = 0;
    const topItems = demoItems.slice(0, 3);
    for (const item of topItems) {
      for (const tone of tones) {
        const prompt = buildPostGenerationPrompt({ item, tone, length: "medium", ng_words: [] });
        await provider.generateText(prompt);
        generatedCount++;
      }
    }
    return NextResponse.json({
      success: true,
      workflow: "generate",
      items_processed: topItems.length,
      variants_generated: generatedCount,
      timestamp: new Date().toISOString(),
    });
  }

  const workflowId = await startWorkflow("generate");

  try {
    const provider = createAIProvider();
    console.log(`[generate] Using AI provider: ${provider.name}`);
    const tones = ["click_bait", "natural", "casual"] as const;
    const labels = ["A", "B", "C"];

    // NGワードを取得
    const account = await getFirstActiveAccount();
    const ngRules = await getContentRules();
    const ngWords = ngRules.filter((r) => r.rule_type === "ng_word").map((r) => r.value);

    let accountNgWords: string[] = [];
    if (account) {
      const accSettings = await getAccountSettings(account.id);
      if (accSettings) {
        accountNgWords = accSettings.ng_words;
      }
    }
    const allNgWords = [...new Set([...ngWords, ...accountNgWords])];

    // variantが未生成の候補を取得（URLパラメータでlimit指定可能）
    const url = new URL(request.url, "http://localhost");
    const genLimit = parseInt(url.searchParams.get("limit") || "50", 10);
    // full=1: 3トーン+ハッシュタグ生成（デフォルトは1トーンで全候補カバー優先）
    const fullMode = url.searchParams.get("full") === "1";
    const activeTones = fullMode ? tones : (["click_bait"] as const);
    const activeLabels = fullMode ? labels : ["A"];

    console.log(`[generate] Mode: ${fullMode ? "full (3 tones + hashtags)" : "quick (1 tone, max coverage)"}, limit: ${genLimit}`);

    const candidates = await getTopCandidatesForGeneration(genLimit);
    let generatedCount = 0;
    let aiCallCount = 0;
    let consecutiveFailures = 0;

    // レート制限時のリトライ用
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    // レート制限対応のAI呼び出しラッパー
    async function callAIWithRetry(prompt: string, maxRetries = 2): Promise<Awaited<ReturnType<typeof provider.generateText>> | null> {
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const result = await provider.generateText(prompt);
          aiCallCount++;
          consecutiveFailures = 0;
          return result;
        } catch (err) {
          aiCallCount++;
          const errStr = String(err);
          // レート制限エラーの場合はリトライ
          if ((errStr.includes("429") || errStr.includes("rate") || errStr.includes("Rate")) && attempt < maxRetries) {
            const waitMs = (attempt + 1) * 3000; // 3s, 6s
            console.warn(`[generate] Rate limited, waiting ${waitMs}ms before retry ${attempt + 1}/${maxRetries}`);
            await delay(waitMs);
            continue;
          }
          consecutiveFailures++;
          console.error(`[generate] AI failed (attempt ${attempt + 1}):`, errStr);
          return null;
        }
      }
      return null;
    }

    for (const candidate of candidates) {
      if (!candidate.item) continue;

      // 連続失敗が5回を超えたら中断（プロバイダー障害と判断）
      if (consecutiveFailures >= 5) {
        console.error(`[generate] 5 consecutive failures, stopping generation early`);
        break;
      }

      // 既存バリアントを全削除してから新規作成（デモ残留を完全防止）
      const db = (await import("@/lib/supabase/admin")).getAdminClient();
      const { data: oldVariants } = await db
        .from("candidate_post_variants")
        .select("id")
        .eq("candidate_id", candidate.id);
      if (oldVariants && oldVariants.length > 0) {
        await db.from("candidate_post_variants").delete().eq("candidate_id", candidate.id);
        console.log(`[generate] Deleted ${oldVariants.length} old variants for candidate ${candidate.id}`);
      }

      let candidateHasVariant = false;
      for (let t = 0; t < activeTones.length; t++) {
        const tone = activeTones[t];
        const prompt = buildPostGenerationPrompt({
          item: candidate.item,
          tone,
          length: "medium",
          ng_words: allNgWords,
        });

        const result = await callAIWithRetry(prompt);
        if (!result) continue;

        // デモテキストが返された場合はスキップ
        if (result.text.startsWith("[デモ]") || result.model === "demo-mock") {
          console.warn(`[generate] Demo text returned for candidate ${candidate.id}, skipping`);
          continue;
        }

        // ハッシュタグ生成（quickモードではスキップして速度を稼ぐ）
        let hashtags: string[] = [];
        if (fullMode) {
          const hashtagResult = await callAIWithRetry(buildHashtagPrompt(candidate.item, 3));
          if (hashtagResult) {
            hashtags = hashtagResult.text
              .split("\n")
              .map((h) => h.trim())
              .filter((h) => h.startsWith("#"));
          }
        }

        await createVariant({
          candidate_id: candidate.id,
          variant_label: activeLabels[t],
          body_text: result.text,
          tone,
          length: "medium",
          hashtags,
          is_selected: t === 0, // 最初のバリアントをデフォルト選択
        });
        candidateHasVariant = true;

        // AIログ記録
        await createAILog({
          candidate_id: candidate.id,
          prompt_type: "post_body",
          provider: result.provider,
          model: result.model,
          input_tokens: result.input_tokens,
          output_tokens: result.output_tokens,
          duration_ms: result.duration_ms,
          success: true,
        });

        generatedCount++;
      }

      console.log(`[generate] Candidate ${candidate.id}: ${candidateHasVariant ? "OK" : "FAILED"} (total: ${generatedCount} variants, ${aiCallCount} API calls)`);
    }

    // ---- 自動投稿: 承認なしでスケジュール登録 ----
    // pipeline経由の場合はpipeline側でauto-postするのでスキップ
    const calledFromPipeline = new URL(request.url, "http://localhost").searchParams.get("from") === "pipeline";
    let autoScheduledCount = 0;
    const settings = await getSystemSettings();
    const autoPostEnabled = settings?.auto_post_enabled ?? false;

    console.log(`[generate] Auto-post check: enabled=${autoPostEnabled}, fromPipeline=${calledFromPipeline}, candidates=${candidates.length}, account=${account?.id || "NULL"}`);

    if (autoPostEnabled && !calledFromPipeline && candidates.length > 0 && account) {
      // 既存スケジュールを取得して最適時間枠を計算
      const existingScheduled = await getScheduledPosts({ status: "scheduled" });
      const slots = findOptimalTimeSlots(existingScheduled, candidates.length);

      for (let i = 0; i < candidates.length; i++) {
        const candidate = candidates[i];
        // is_selected=true の variant を取得
        const db = (await import("@/lib/supabase/admin")).getAdminClient();
        const { data: selectedVariant } = await db
          .from("candidate_post_variants")
          .select("id")
          .eq("candidate_id", candidate.id)
          .eq("is_selected", true)
          .limit(1)
          .single();

        if (!selectedVariant) {
          console.log(`[generate] No selected variant for candidate ${candidate.id}, skipping`);
          continue;
        }

        // スケジュール時間を決定（slot.hourはUTC）
        const now = new Date();
        const slot = slots[i];
        let scheduledAt: Date;
        if (slot) {
          scheduledAt = new Date(now);
          scheduledAt.setUTCHours(slot.hour, slot.minute, 0, 0);
          // 既に過ぎている時間帯なら翌日に設定
          if (scheduledAt <= now) {
            scheduledAt.setUTCDate(scheduledAt.getUTCDate() + 1);
          }
        } else {
          // スロットが足りない場合は翌日のJST 10:00 = UTC 01:00
          scheduledAt = new Date(now);
          scheduledAt.setUTCDate(scheduledAt.getUTCDate() + 1);
          scheduledAt.setUTCHours(1, 0, 0, 0);
        }

        // candidate を approved に変更
        await updateCandidateStatus(candidate.id, "approved");

        // scheduled_posts に登録
        await createScheduledPost({
          candidate_id: candidate.id,
          account_id: account.id,
          variant_id: selectedVariant.id,
          scheduled_at: scheduledAt.toISOString(),
          post_mode: "A",
        });

        autoScheduledCount++;
        console.log(`[generate] Auto-scheduled candidate ${candidate.id} at ${scheduledAt.toISOString()}`);
      }
    } else if (!account) {
      console.error(`[generate] No active account found — cannot auto-schedule. Create an account in the accounts table.`);
    }

    await completeWorkflow(workflowId, generatedCount);

    return NextResponse.json({
      success: true,
      workflow: "generate",
      ai_provider: provider.name,
      items_processed: candidates.length,
      variants_generated: generatedCount,
      auto_scheduled: autoScheduledCount,
      auto_post_enabled: autoPostEnabled,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    await completeWorkflow(workflowId, 0, String(error));
    await logError("cron/generate", String(error));
    return NextResponse.json(
      { error: "Generation failed", details: String(error) },
      { status: 500 }
    );
  }
}
