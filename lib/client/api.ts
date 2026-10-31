"use client";

import { usageCostUsd } from "@/lib/cost/pricing";
import type { ChatRequest, Turn } from "@/lib/conversation/types";
import type { Analysis } from "@/lib/prompts/analyzer";
import type { AssistRequest } from "@/lib/prompts/assist";
import type { Usage } from "@/lib/providers/llm/types";

export type ApiErrorKind =
  | "not_configured"
  | "unauthorized"
  | "rate_limited"
  | "provider"
  | "provider_auth"
  | "provider_credit"
  | "network"
  | "offline"
  | "bad_request";

export class ApiError extends Error {
  constructor(public readonly kind: ApiErrorKind) {
    super(kind);
  }
}

export const API_ERROR_TEXT: Record<ApiErrorKind, string> = {
  not_configured: "The AI service isn't connected yet. Finish setup first.",
  unauthorized: "Your session expired. Reload and unlock again.",
  rate_limited: "The AI service is busy. Wait a few seconds and try again.",
  provider: "The AI service had a problem. Try again.",
  provider_auth: "The AI key was rejected. Check OPENROUTER_API_KEY (or DEEPSEEK_API_KEY) in Vercel, then redeploy.",
  provider_credit: "Your AI credit ran out. Top up at openrouter.ai/credits (a few dollars lasts weeks).",
  network: "Couldn't reach the server. Check your internet and try again.",
  offline: "You're offline. Reconnect and try again; your progress is saved on this device.",
  bad_request: "Something in the request was wrong. Try again.",
};

/** Read the server's error code when there is one; fall back to the HTTP status. */
async function kindOf(res: Response): Promise<ApiErrorKind> {
  const code = await res
    .clone()
    .json()
    .then((b: { error?: string }) => b?.error)
    .catch(() => undefined);
  if (code === "provider_auth" || code === "provider_credit") return code;
  return kindFor(res.status);
}

function networkError(): ApiError {
  return new ApiError(typeof navigator !== "undefined" && navigator.onLine === false ? "offline" : "network");
}

export function kindFor(status: number): ApiErrorKind {
  if (status === 503) return "not_configured";
  if (status === 402) return "provider_credit";
  if (status === 401) return "unauthorized";
  if (status === 429) return "rate_limited";
  if (status === 400) return "bad_request";
  return "provider";
}

async function postJson<T>(url: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal,
  }).catch((err: unknown) => {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw networkError();
  });
  if (!res.ok) throw new ApiError(await kindOf(res));
  return (await res.json()) as T;
}

export interface ChatResult {
  text: string;
  model: string;
  usage: Usage | null;
}

/** Stream the tutor's reply. `onDelta` receives text as it arrives. */
export async function streamChat(
  body: ChatRequest,
  onDelta: (text: string) => void,
  signal?: AbortSignal,
): Promise<ChatResult> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal,
  }).catch((err: unknown) => {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw networkError();
  });
  if (!res.ok || !res.body) throw new ApiError(res.ok ? "provider" : await kindOf(res));

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  let model = "";
  let usage: Usage | null = null;
  const handle = (line: string) => {
    if (!line.trim()) return;
    const ev = JSON.parse(line) as { t: string; text?: string; model?: string; usage?: Usage | null };
    if (ev.t === "delta" && ev.text) {
      text += ev.text;
      onDelta(ev.text);
    } else if (ev.t === "done") {
      model = ev.model ?? "";
      usage = ev.usage ?? null;
    } else if (ev.t === "error") {
      throw new ApiError("provider");
    }
  };
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buffer.indexOf("\n")) !== -1) {
      handle(buffer.slice(0, nl));
      buffer = buffer.slice(nl + 1);
    }
  }
  handle(buffer);
  if (!text.trim()) throw new ApiError("provider");
  return { text: text.trim(), model, usage };
}

/**
 * A fresh first line for the tutor, written by the model. Resolves to null when it fails or
 * comes back empty, so the caller falls back to the scripted opener.
 */
export async function fetchOpener(
  body: ChatRequest,
  addCost: (usd: number) => void,
  timeoutMs = 8000,
): Promise<string | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await streamChat(body, () => {}, ctrl.signal);
    addCost(usageCostUsd(res.model, res.usage));
    const text = res.text.trim();
    return text.length >= 8 ? text : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export function analyzeSession(
  scenarioId: string,
  history: Turn[],
  memory: string[] = [],
  challenge?: string,
  signal?: AbortSignal,
) {
  return postJson<{ analysis: Analysis; model: string; usage: Usage | null }>(
    "/api/analyze",
    { scenarioId, history, memory, challenge },
    signal,
  );
}

type AssistOut = {
  hint: { ideas: string[] };
  better: { better: string; why_en: string; why_he: string };
  simplify: { simple: string; hebrew: string };
  translate: { hebrew: string };
  define: { items: { text: string; meaning_en: string; meaning_he: string; example: string }[] };
};

export function assist<M extends AssistRequest["mode"]>(
  req: Extract<AssistRequest, { mode: M }>,
  signal?: AbortSignal,
): Promise<AssistOut[M] & { model: string; usage: Usage | null }> {
  return postJson("/api/assist", req, signal);
}
