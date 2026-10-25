"use client";

import type { ChatRequest, Turn } from "@/lib/conversation/types";
import type { Analysis } from "@/lib/prompts/analyzer";
import type { AssistRequest } from "@/lib/prompts/assist";
import type { Usage } from "@/lib/providers/llm/types";

export type ApiErrorKind = "not_configured" | "unauthorized" | "rate_limited" | "provider" | "network" | "bad_request";

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
  network: "No connection. Check your internet and try again.",
  bad_request: "Something in the request was wrong. Try again.",
};

function kindFor(status: number): ApiErrorKind {
  if (status === 503) return "not_configured";
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
    throw new ApiError("network");
  });
  if (!res.ok) throw new ApiError(kindFor(res.status));
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
    throw new ApiError("network");
  });
  if (!res.ok || !res.body) throw new ApiError(kindFor(res.status));

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

export function analyzeSession(scenarioId: string, history: Turn[], signal?: AbortSignal) {
  return postJson<{ analysis: Analysis; model: string; usage: Usage | null }>(
    "/api/analyze",
    { scenarioId, history },
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
