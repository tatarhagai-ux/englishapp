import "server-only";
import { z } from "zod";

/**
 * Server-side environment. Every provider is optional so the app can boot (and show the
 * setup checklist) before any account exists. Code that needs a provider calls the
 * matching `require*` helper, which throws a typed error the API routes turn into a 503.
 */
const schema = z.object({
  APP_ACCESS_CODE: z.string().min(6).optional(),
  APP_SESSION_SECRET: z.string().min(32).optional(),

  AZURE_SPEECH_KEY: z.string().min(10).optional(),
  AZURE_SPEECH_REGION: z.string().min(2).optional(),

  LLM_PROVIDER: z.enum(["openrouter", "deepseek"]).optional(),
  OPENROUTER_API_KEY: z.string().min(10).optional(),
  DEEPSEEK_API_KEY: z.string().min(10).optional(),
  LLM_CHAT_MODEL: z.string().optional(),
  LLM_ANALYZER_MODEL: z.string().optional(),
  /** Speech-to-text model on OpenRouter's transcription endpoint (optional override). */
  STT_MODEL: z.string().optional(),

  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(10).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(10).optional(),

  MONTHLY_BUDGET_USD: z.coerce.number().positive().default(15),
});

export type Env = z.infer<typeof schema>;

function read(): Env {
  // Empty strings (common when a Vercel variable is created but left blank) count as unset.
  const raw = Object.fromEntries(Object.entries(process.env).filter(([, v]) => v !== undefined && v !== ""));
  return schema.parse(raw);
}

export const env: Env = read();

export class NotConfiguredError extends Error {
  constructor(public readonly service: string) {
    super(`${service} is not configured yet`);
    this.name = "NotConfiguredError";
  }
}

export function requireAzure() {
  if (!env.AZURE_SPEECH_KEY || !env.AZURE_SPEECH_REGION) throw new NotConfiguredError("Azure Speech");
  return { key: env.AZURE_SPEECH_KEY, region: env.AZURE_SPEECH_REGION };
}

const DEFAULT_MODELS = {
  // The report runs once a conversation, so it gets a stronger model than the live chat,
  // which needs speed. Hagai approved this on 31.10.2026 (cheap, a step up in quality).
  openrouter: { chat: "deepseek/deepseek-v4-flash", analyzer: "anthropic/claude-haiku-5.5" },
  deepseek: { chat: "deepseek-chat", analyzer: "deepseek-chat" },
} as const;

/**
 * Which LLM provider to use. LLM_PROVIDER wins; otherwise whichever key is present, with
 * OpenRouter preferred when both are (it can reach every model the eval compares).
 */
export function llmConfig() {
  const provider =
    env.LLM_PROVIDER ?? (env.OPENROUTER_API_KEY ? "openrouter" : env.DEEPSEEK_API_KEY ? "deepseek" : "openrouter");
  const apiKey = provider === "deepseek" ? env.DEEPSEEK_API_KEY : env.OPENROUTER_API_KEY;
  if (!apiKey) throw new NotConfiguredError(provider === "deepseek" ? "DeepSeek" : "OpenRouter");
  return {
    provider,
    apiKey,
    chatModel: env.LLM_CHAT_MODEL ?? DEFAULT_MODELS[provider].chat,
    analyzerModel: env.LLM_ANALYZER_MODEL ?? DEFAULT_MODELS[provider].analyzer,
  } as const;
}

/** Which services are configured. Booleans only, never values. */
export function setupStatus() {
  return {
    accessGate: Boolean(env.APP_ACCESS_CODE && env.APP_SESSION_SECRET),
    azure: Boolean(env.AZURE_SPEECH_KEY && env.AZURE_SPEECH_REGION),
    llm: Boolean(env.OPENROUTER_API_KEY || env.DEEPSEEK_API_KEY),
    supabase: Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  };
}

export type SetupStatus = ReturnType<typeof setupStatus>;
