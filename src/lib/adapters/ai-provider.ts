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
      throw new Error("[ClaudeProvider] ANTHROPIC_API_KEY is not set");
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
      throw new Error(`[ClaudeProvider] API error: ${JSON.stringify(data.error || data)}`);
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
}

// ---------- OpenAI Provider ----------
export class OpenAIProvider implements AIProvider {
  readonly name = "openai";

  async generateText(prompt: string, systemPrompt?: string): Promise<AIGenerationResult> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("[OpenAIProvider] OPENAI_API_KEY is not set");
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

    if (!res.ok || data.error) {
      throw new Error(`[OpenAIProvider] API error: ${JSON.stringify(data.error || data)}`);
    }

    return {
      text: data.choices?.[0]?.message?.content || "",
      input_tokens: data.usage?.prompt_tokens || 0,
      output_tokens: data.usage?.completion_tokens || 0,
      duration_ms: Date.now() - start,
      model: data.model || "gpt-4o",
      provider: "openai",
    };
  }
}

// ---------- Gemini Provider ----------
export class GeminiProvider implements AIProvider {
  readonly name = "gemini";

  async generateText(prompt: string, systemPrompt?: string): Promise<AIGenerationResult> {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      throw new Error("[GeminiProvider] GEMINI_API_KEY / GOOGLE_AI_API_KEY is not set");
    }

    const start = Date.now();
    const model = process.env.AI_MODEL || "gemini-2.0-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const contents = [];
    if (systemPrompt) {
      contents.push({ role: "user", parts: [{ text: systemPrompt }] });
      contents.push({ role: "model", parts: [{ text: "了解しました。" }] });
    }
    contents.push({ role: "user", parts: [{ text: prompt }] });

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: { maxOutputTokens: 1024 },
      }),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      throw new Error(`[GeminiProvider] API error: ${JSON.stringify(data.error || data)}`);
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const usage = data.usageMetadata || {};

    return {
      text,
      input_tokens: usage.promptTokenCount || 0,
      output_tokens: usage.candidatesTokenCount || 0,
      duration_ms: Date.now() - start,
      model,
      provider: "gemini",
    };
  }
}

// ---------- Groq Provider (無料・クレカ不要) ----------
export class GroqProvider implements AIProvider {
  readonly name = "groq";

  async generateText(prompt: string, systemPrompt?: string): Promise<AIGenerationResult> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("[GroqProvider] GROQ_API_KEY is not set");
    }

    const start = Date.now();
    const model = process.env.AI_MODEL || "llama-3.3-70b-versatile";
    const messages = [];
    if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
    messages.push({ role: "user", content: prompt });

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages, max_tokens: 1024 }),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      throw new Error(`[GroqProvider] API error: ${JSON.stringify(data.error || data)}`);
    }

    return {
      text: data.choices?.[0]?.message?.content || "",
      input_tokens: data.usage?.prompt_tokens || 0,
      output_tokens: data.usage?.completion_tokens || 0,
      duration_ms: Date.now() - start,
      model: data.model || model,
      provider: "groq",
    };
  }
}

// ---------- Fallback Provider（失敗時に次のプロバイダーに自動切替） ----------
class FallbackProvider implements AIProvider {
  readonly name: string;
  private providers: AIProvider[];

  constructor(providers: AIProvider[]) {
    this.providers = providers;
    this.name = providers.map((p) => p.name).join("→");
  }

  async generateText(prompt: string, systemPrompt?: string): Promise<AIGenerationResult> {
    for (let i = 0; i < this.providers.length; i++) {
      try {
        const result = await this.providers[i].generateText(prompt, systemPrompt);
        return result;
      } catch (err) {
        console.warn(`[AI] ${this.providers[i].name} failed: ${String(err)}`);
        if (i === this.providers.length - 1) throw err;
        console.log(`[AI] Falling back to ${this.providers[i + 1].name}`);
      }
    }
    throw new Error("All AI providers failed");
  }
}

// ---------- Factory ----------
export function createAIProvider(provider?: string): AIProvider {
  // 利用可能なプロバイダーを全て収集（フォールバックチェーン用）
  const available: AIProvider[] = [];

  const p = provider || process.env.AI_PROVIDER;

  // 明示的指定があればそれを最優先
  if (p) {
    switch (p) {
      case "gemini": available.push(new GeminiProvider()); break;
      case "groq": available.push(new GroqProvider()); break;
      case "claude": available.push(new ClaudeProvider()); break;
      case "openai": available.push(new OpenAIProvider()); break;
    }
  }

  // 残りのプロバイダーをフォールバックとして追加
  const added = new Set(available.map((a) => a.name));
  if (!added.has("gemini") && (process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY)) {
    available.push(new GeminiProvider());
  }
  if (!added.has("groq") && process.env.GROQ_API_KEY) {
    available.push(new GroqProvider());
  }
  if (!added.has("claude") && process.env.ANTHROPIC_API_KEY) {
    available.push(new ClaudeProvider());
  }
  if (!added.has("openai") && process.env.OPENAI_API_KEY) {
    available.push(new OpenAIProvider());
  }

  if (available.length === 0) {
    throw new Error("[AI] No AI provider API key found. Set GROQ_API_KEY, GEMINI_API_KEY, ANTHROPIC_API_KEY, or OPENAI_API_KEY.");
  }

  console.log(`[AI] Provider chain: ${available.map((a) => a.name).join(" → ")}`);
  return new FallbackProvider(available);
}
