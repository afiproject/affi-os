import { NextResponse } from "next/server";
import { createAIProvider } from "@/lib/adapters/ai-provider";
import { buildPostGenerationPrompt, type PostGenerationParams } from "@/lib/prompts/post-generation";
import { isDemoMode } from "@/lib/supabase/admin";
import { getItemById, createAILog } from "@/lib/db";
import { demoItems } from "@/lib/demo-data";

// POST /api/ai/generate — AI文面生成
export async function POST(request: Request) {
  const body = await request.json();
  const { item_id, tone, length, ng_words } = body;

  let item = isDemoMode()
    ? demoItems.find((i) => i.id === item_id) || null
    : await getItemById(item_id);

  if (!item) {
    // フォールバック: デモデータも確認
    item = demoItems.find((i) => i.id === item_id) || null;
  }
  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const params: PostGenerationParams = {
    item,
    tone: tone || "natural",
    length: length || "medium",
    ng_words: ng_words || [],
  };

  const prompt = buildPostGenerationPrompt(params);
  const provider = createAIProvider();

  try {
    const result = await provider.generateText(prompt);

    // AIログ記録（非同期、エラーは無視）
    if (!isDemoMode()) {
      createAILog({
        prompt_type: "post_body",
        provider: result.provider,
        model: result.model,
        input_tokens: result.input_tokens,
        output_tokens: result.output_tokens,
        duration_ms: result.duration_ms,
        success: true,
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      generated_text: result.text,
      provider: result.provider,
      model: result.model,
      tokens: {
        input: result.input_tokens,
        output: result.output_tokens,
      },
      duration_ms: result.duration_ms,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "AI generation failed", details: String(error) },
      { status: 500 }
    );
  }
}
