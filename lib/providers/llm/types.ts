export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  /** Ask for a JSON object back (used by the analyzer and planner). */
  json?: boolean;
  signal?: AbortSignal;
}

export interface Usage {
  promptTokens: number;
  completionTokens: number;
  /** Prompt tokens served from the provider's cache (cheaper). */
  cachedPromptTokens?: number;
  /** Provider-reported cost in USD when available (OpenRouter returns it). */
  costUsd?: number;
}

export type ChatStreamEvent = { type: "delta"; text: string } | { type: "done"; usage?: Usage };

export interface LlmProvider {
  readonly name: string;
  stream(req: ChatRequest): AsyncIterable<ChatStreamEvent>;
  complete(req: ChatRequest): Promise<{ text: string; usage?: Usage }>;
}
