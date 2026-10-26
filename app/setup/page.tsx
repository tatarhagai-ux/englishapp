import Link from "next/link";
import { CheckCircle2, ChevronLeft, Circle, ExternalLink } from "lucide-react";
import { setupStatus } from "@/lib/env";

export const dynamic = "force-dynamic";

const STEPS = [
  {
    key: "accessGate" as const,
    title: "Access code",
    vars: ["APP_ACCESS_CODE", "APP_SESSION_SECRET"],
    why: "Locks the app so nobody else can use your credit if they find the link.",
    link: null,
  },
  {
    key: "azure" as const,
    title: "Azure Speech (optional, free tier)",
    vars: ["AZURE_SPEECH_KEY", "AZURE_SPEECH_REGION"],
    why: "Natural voices and pronunciation scores. Without it, the app uses your browser's own voices and speech recognition (best in Edge or Chrome), and checks which words were heard instead of scoring sounds.",
    link: {
      href: "https://portal.azure.com/#create/Microsoft.CognitiveServicesSpeechServices",
      label: "Create Speech resource",
    },
  },
  {
    key: "llm" as const,
    title: "AI model (OpenRouter or DeepSeek)",
    vars: ["OPENROUTER_API_KEY", "or DEEPSEEK_API_KEY"],
    why: "The tutor's brain. OpenRouter: one key for many models, good while comparing. DeepSeek direct: a bit cheaper.",
    link: { href: "https://openrouter.ai/settings/keys", label: "Get an OpenRouter key" },
  },
  {
    key: "supabase" as const,
    title: "Supabase",
    vars: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"],
    why: "Optional. Syncs conversations, mistakes and progress between your phone and computer. Without it, everything stays on one device.",
    link: { href: "https://supabase.com/dashboard/projects", label: "Open Supabase" },
  },
];

export default function SetupPage() {
  const status = setupStatus();
  const done = STEPS.filter((s) => status[s.key]).length;

  return (
    <main className="mx-auto max-w-xl space-y-5 px-4 py-6">
      <header className="flex items-center gap-2">
        <Link href="/" aria-label="Back home" className="-ml-2 rounded-full p-2 text-dim hover:text-text">
          <ChevronLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Setup</h1>
          <p className="text-sm text-dim">
            {done} of {STEPS.length} connected. Add each value in Vercel → Settings → Environment Variables, then
            redeploy.
          </p>
        </div>
      </header>

      <div className="h-2 overflow-hidden rounded-full bg-elev-2" aria-hidden>
        <div className="accent-gradient h-full transition-all" style={{ width: `${(done / STEPS.length) * 100}%` }} />
      </div>

      <ol className="space-y-3">
        {STEPS.map((s, i) => {
          const ok = status[s.key];
          return (
            <li key={s.key} className="card p-4">
              <div className="flex items-start gap-3">
                {ok ? (
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-good" aria-label="Connected" />
                ) : (
                  <Circle className="mt-0.5 size-5 shrink-0 text-faint" aria-label="Not connected" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {i + 1}. {s.title}
                  </p>
                  <p className="mt-1 text-sm text-dim">{s.why}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {s.vars.map((v) => (
                      <code key={v} className="rounded-md bg-elev-2 px-2 py-0.5 font-mono text-[11px] text-dim">
                        {v}
                      </code>
                    ))}
                  </div>
                  {s.link && !ok && (
                    <a
                      href={s.link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-accent"
                    >
                      {s.link.label} <ExternalLink className="size-3.5" aria-hidden />
                    </a>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="text-center text-xs text-faint">The full step-by-step guide is in docs/SETUP.md.</p>
    </main>
  );
}
