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

    // 上位候補を取得（まだvariantが生成されていないもの）
    const candidates = await getTopCandidatesForGeneration(5);
    let generatedCount = 0;

    for (const candidate of candidates) {
      if (!candidate.item) continue;

      for (let t = 0; t < tones.length; t++) {
        const tone = tones[t];
        const prompt = buildPostGenerationPrompt({
          item: candidate.item,
          tone,
          length: "medium",
          ng_words: allNgWords,
        });

        const result = await provider.generateText(prompt);

        // ハッシュタグも生成
        const hashtagPrompt = buildHashtagPrompt(candidate.item, 3);
        const hashtagResult = await provider.generateText(hashtagPrompt);
        const hashtags = hashtagResult.text
          .split("\n")
          .map((h) => h.trim())
          .filter((h) => h.startsWith("#"));

        await createVariant({
          candidate_id: candidate.id,
          variant_label: labels[t],
          body_text: result.text,
          tone,
          length: "medium",
          hashtags,
          is_selected: t === 0, // 最初のバリアントをデフォルト選択
        });

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
    }

    // ---- 自動投稿: 承認なしでスケジュール登録 ----
    let autoScheduledCount = 0;
    const settings = await getSystemSettings();
    const autoPostEnabled = settings?.auto_post_enabled ?? true;

    if (autoPostEnabled && candidates.length > 0 && account) {
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

        if (!selectedVariant) continue;

        // スケジュール時間を決定
        const now = new Date();
        const slot = slots[i];
        let scheduledAt: Date;
        if (slot) {
          scheduledAt = new Date(now);
          scheduledAt.setHours(slot.hour, slot.minute, 0, 0);
          // 既に過ぎている時間帯なら翌日に設定
          if (scheduledAt <= now) {
            scheduledAt.setDate(scheduledAt.getDate() + 1);
          }
        } else {
          // スロットが足りない場合は翌日の10:00
          scheduledAt = new Date(now);
          scheduledAt.setDate(scheduledAt.getDate() + 1);
          scheduledAt.setHours(10, 0, 0, 0);
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
      }
    }

    await completeWorkflow(workflowId, generatedCount);

    return NextResponse.json({
      success: true,
      workflow: "generate",
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
