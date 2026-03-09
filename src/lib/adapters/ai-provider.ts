// ========================================
// AI Provider Adapter
// プロバイダーを切り替え可能な抽象インターフェース
// ========================================

export interface AIGenerationResult {
  text: string;
  input_tokens: number;
  output_tokens: number;
  duration_ms: number;
  model: string;
  provider: string;
}

export interface AIProvider {
  readonly name: string;
  generateText(prompt: string, systemPrompt?: string): Promise<AIGenerationResult>;
}

// ---------- Claude Provider ----------
export class ClaudeProvider implements AIProvider {
  readonly name = "claude";

  async generateText(prompt: string, systemPrompt?: string): Promise<AIGenerationResult> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return this.mockGenerate(prompt);
    }

    const start = Date.now();
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || "claude-sonnet-4-6",
        max_tokens: 1024,
        system: systemPrompt || "",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      console.error("[ClaudeProvider] API error:", JSON.stringify(data));
      return this.mockGenerate(prompt);
    }

    return {
      text: data.content?.[0]?.text || "",
      input_tokens: data.usage?.input_tokens || 0,
      output_tokens: data.usage?.output_tokens || 0,
      duration_ms: Date.now() - start,
      model: data.model || "claude-sonnet-4-6",
      provider: "claude",
    };
  }

  private async mockGenerate(prompt: string): Promise<AIGenerationResult> {
    // デモモード用のモック
    await new Promise((r) => setTimeout(r, 100));
    return {
      text: `[デモ] AIが生成した文面です。プロンプト: ${prompt.slice(0, 50)}...`,
      input_tokens: prompt.length,
      output_tokens: 50,
      duration_ms: 100,
      model: "demo-mock",
      provider: "claude",
    };
  }
}

// ---------- OpenAI Provider ----------
export class OpenAIProvider implements AIProvider {
  readonly name = "openai";

  async generateText(prompt: string, systemPrompt?: string): Promise<AIGenerationResult> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return this.mockGenerate(prompt);
    }

    const start = Date.now();
    const messages = [];
    if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
    messages.push({ role: "user", content: prompt });

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages,
        max_tokens: 1024,
      }),
    });

    const data = await res.json();
    return {
      text: data.choices?.[0]?.message?.content || "",
      input_tokens: data.usage?.prompt_tokens || 0,
      output_tokens: data.usage?.completion_tokens || 0,
      duration_ms: Date.now() - start,
      model: data.model || "gpt-4o",
      provider: "openai",
    };
  }

  private async mockGenerate(prompt: string): Promise<AIGenerationResult> {
    await new Promise((r) => setTimeout(r, 100));
    return {
      text: `[デモ] OpenAI生成文面。プロンプト: ${prompt.slice(0, 50)}...`,
      input_tokens: prompt.length,
      output_tokens: 50,
      duration_ms: 100,
      model: "demo-mock",
      provider: "openai",
    };
  }
}

// ---------- Factory ----------
export function createAIProvider(provider?: string): AIProvider {
  const p = provider || process.env.AI_PROVIDER || "claude";
  switch (p) {
    case "openai":
      return new OpenAIProvider();
    case "claude":
    default:
      return new ClaudeProvider();
  }
}
