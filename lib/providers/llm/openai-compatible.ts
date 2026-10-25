import "server-only";
import { ProviderError } from "@/lib/providers/errors";
import { readSse } from "./sse";
import type { ChatRequest, ChatStreamEvent, LlmProvider, Usage } from "./types";

const TIMEOUT_MS = 45_000;

interface RawUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  /** OpenRouter: provider-reported cost in USD. */
  cost?: number;
  /** DeepSeek: tokens served from its context cache (billed at a tenth). */
  prompt_cache_hit_tokens?: number;
  /** OpenAI-style cached token count (OpenRouter passes it through). */
  prompt_tokens_details?: { cached_tokens?: number };
}

export function toUsage(raw: RawUsage | undefined): Usage | undefined {
  if (!raw) return undefined;
  return {
    promptTokens: raw.prompt_tokens ?? 0,
    completionTokens: raw.completion_tokens ?? 0,
    cachedPromptTokens: raw.prompt_cache_hit_tokens ?? raw.prompt_tokens_details?.cached_tokens ?? 0,
    costUsd: typeof raw.cost === "number" ? raw.cost : undefined,
  };
}

export interface OpenAICompatibleConfig {
  name: string;
  endpoint: string;
  apiKey: string;
  headers?: Record<string, string>;
  /** Provider-specific fields added to every request body. */
  extraBody?: Record<string, unknown>;
  /** Extra fields for streaming requests only (e.g. asking for a final usage chunk). */
  streamBody?: Record<string, unknown>;
}

/**
 * One client for every OpenAI-compatible chat API. OpenRouter and DeepSeek's own API differ
 * only in endpoint, auth header extras and how they report usage.
 */
export function createOpenAICompatible(cfg: OpenAICompatibleConfig): LlmProvider {
  async function post(req: ChatRequest, stream: boolean): Promise<Response> {
    const signal = req.signal
      ? AbortSignal.any([req.signal, AbortSignal.timeout(TIMEOUT_MS)])
      : AbortSignal.timeout(TIMEOUT_MS);
    const res = await fetch(cfg.endpoint, {
      method: "POST",
      signal,
      headers: { Authorization: `Bearer ${cfg.apiKey}`, "Content-Type": "application/json", ...cfg.headers },
      body: JSON.stringify({
        model: req.model,
        messages: req.messages,
        temperature: req.temperature ?? 0.7,
        max_tokens: req.maxTokens,
        stream,
        ...cfg.extraBody,
        ...(stream ? cfg.streamBody : {}),
        ...(req.json ? { response_format: { type: "json_object" } } : {}),
      }),
    }).catch((err: unknown) => {
      const timedOut = err instanceof DOMException && err.name === "TimeoutError";
      throw new ProviderError(cfg.name, timedOut ? 504 : 502, timedOut ? "request timed out" : "network error");
    });
    if (!res.ok) {
      const detail = (await res.text().catch(() => "")).slice(0, 300);
      throw new ProviderError(cfg.name, res.status, detail || res.statusText);
    }
    return res;
  }

  return {
    name: cfg.name,

    async *stream(req): AsyncGenerator<ChatStreamEvent> {
      const res = await post(req, true);
      if (!res.body) throw new ProviderError(cfg.name, 502, "empty stream");
      let usage: Usage | undefined;
      for await (const data of readSse(res.body)) {
        let chunk: {
          choices?: { delta?: { content?: string } }[];
          usage?: RawUsage;
          error?: { message?: string };
        };
        try {
          chunk = JSON.parse(data);
        } catch {
          continue;
        }
        if (chunk.error) throw new ProviderError(cfg.name, 502, chunk.error.message ?? "stream error");
        const text = chunk.choices?.[0]?.delta?.content;
        if (text) yield { type: "delta", text };
        if (chunk.usage) usage = toUsage(chunk.usage);
      }
      yield { type: "done", usage };
    },

    async complete(req) {
      const res = await post(req, false);
      const json = (await res.json()) as { choices?: { message?: { content?: string } }[]; usage?: RawUsage };
      return { text: json.choices?.[0]?.message?.content ?? "", usage: toUsage(json.usage) };
    },
  };
}
