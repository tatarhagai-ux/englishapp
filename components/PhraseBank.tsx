"use client";

import { HowItWorks } from "@/components/HowItWorks";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Languages, Loader2, Plus, Square, Trash2, Volume2 } from "lucide-react";
import clsx from "clsx";
import { learner, useHydrated, useLearner } from "@/lib/client/learner";
import { usePrefs } from "@/lib/client/prefs";
import { useClipPlayer } from "@/lib/client/tts";
import { assist, ApiError, API_ERROR_TEXT } from "@/lib/client/api";
import { usageCostUsd } from "@/lib/cost/pricing";
import type { PhraseRecord } from "@/lib/learner/model";
import { parseImport } from "@/lib/text/import";

const MAX_IMPORT = 30;

function dueLabel(p: PhraseRecord, now: number): string {
  const due = new Date(p.card.due).getTime();
  if (due <= now) return "Review today";
  const days = Math.ceil((due - now) / 86_400_000);
  return days === 1 ? "Review tomorrow" : `Review in ${days} days`;
}

export function PhraseBank() {
  const hydrated = useHydrated();
  const state = useLearner();
  const [prefs] = usePrefs();
  const player = useClipPlayer();
  const [importing, setImporting] = useState(false);
  const [raw, setRaw] = useState("");
  const [tag, setTag] = useState("");
  const [status, setStatus] = useState<{ kind: "busy" | "ok" | "error"; text: string } | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [openHe, setOpenHe] = useState<Set<string>>(new Set());

  const tags = useMemo(
    () => [...new Set(state.phrases.map((p) => p.tag).filter(Boolean))] as string[],
    [state.phrases],
  );
  const list = state.phrases
    .filter((p) => filter === "all" || p.tag === filter)
    .slice()
    .sort((a, b) => b.addedAt.localeCompare(a.addedAt));
  const items = parseImport(raw);
  const now = Date.now();

  async function runImport(e: React.FormEvent) {
    e.preventDefault();
    if (!items.length) return;
    const batch = items.slice(0, MAX_IMPORT);
    setStatus({ kind: "busy", text: `Adding ${batch.length} phrases with meanings and Hebrew…` });
    try {
      const r = await assist({ mode: "define", items: batch });
      learner.addSpend(null, usageCostUsd(r.model, r.usage));
      const byText = new Map(r.items.map((i) => [i.text.toLowerCase(), i]));
      const added = learner.addPhrases(
        batch.map((text) => {
          const d = byText.get(text.toLowerCase());
          return { text, meaningEn: d?.meaning_en ?? "", meaningHe: d?.meaning_he ?? "", example: d?.example };
        }),
        tag.trim() || undefined,
      );
      setStatus({
        kind: "ok",
        text: `Added ${added} new phrase${added === 1 ? "" : "s"}.${items.length > MAX_IMPORT ? ` Paste the rest (${items.length - MAX_IMPORT}) in another round.` : ""}`,
      });
      setRaw("");
      setImporting(false);
    } catch (err) {
      setStatus({ kind: "error", text: API_ERROR_TEXT[err instanceof ApiError ? err.kind : "provider"] });
    }
  }

  return (
    <div className="space-y-5">
      <header className="flex items-center gap-2">
        <Link
          href="/progress"
          aria-label="Back to progress"
          className="-ml-2 rounded-full p-2 text-dim hover:text-text"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-black tracking-tight">Phrase bank</h1>
          <p className="text-sm text-dim">
            Phrases from your reports and lists you import. Your tutor works them into conversations, and they come back
            in warm-ups.
          </p>
          <HowItWorks
            steps={[
              "Phrases land here from your reports, from each plan week's words, and from lists you import.",
              "Your tutor gives you chances to use them in conversations.",
              "Each time you use one in a conversation, it counts. Two good uses and it's yours.",
            ]}
            why="Words you only read stay passive. Using them out loud makes them active."
          />
        </div>
      </header>

      {importing ? (
        <form onSubmit={runImport} className="tile space-y-3 p-4">
          <label htmlFor="import-list" className="font-extrabold">
            Paste words or phrases, one per line
          </label>
          <textarea
            id="import-list"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            rows={6}
            placeholder={"tactical empathy\ncalibrated question\nhigh availability\nfollow up"}
            className="w-full rounded-xl border-2 border-line bg-elev-2 px-3 py-2 outline-none focus:border-accent"
          />
          <label htmlFor="import-tag" className="block text-sm font-bold text-dim">
            Where are they from? (optional)
          </label>
          <input
            id="import-tag"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="Never Split the Difference, AZ-900…"
            className="w-full rounded-xl border-2 border-line bg-elev-2 px-3 py-2 outline-none focus:border-accent"
          />
          <p className="text-xs font-bold text-faint">
            {items.length} item{items.length === 1 ? "" : "s"} detected
            {items.length > MAX_IMPORT ? ` (the first ${MAX_IMPORT} will be added)` : ""}. Meanings and Hebrew are added
            automatically.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setImporting(false)} className="btn-3d btn-ghost py-2.5 text-sm">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!items.length || status?.kind === "busy"}
              className="btn-3d btn-go py-2.5 text-sm disabled:opacity-60"
            >
              Add {Math.min(items.length, MAX_IMPORT) || ""}
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => {
            setImporting(true);
            setStatus(null);
          }}
          className="btn-3d btn-accent flex w-full items-center justify-center gap-2 py-3"
        >
          <Plus className="size-5" aria-hidden /> Import a list
        </button>
      )}

      {status && (
        <p
          role={status.kind === "error" ? "alert" : "status"}
          className={clsx(
            "flex items-center gap-2 rounded-xl p-3 text-sm font-bold",
            status.kind === "error" ? "bg-bad/10 text-bad" : status.kind === "ok" ? "bg-go/15 text-good" : "bg-elev-2",
          )}
        >
          {status.kind === "busy" && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {status.text}
        </p>
      )}

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by source">
          {["all", ...tags].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFilter(t)}
              aria-pressed={filter === t}
              className={clsx(
                "rounded-full border-2 px-3 py-1 text-sm font-extrabold",
                filter === t ? "border-accent bg-accent-soft text-accent" : "border-line text-dim",
              )}
            >
              {t === "all" ? "All" : t}
            </button>
          ))}
        </div>
      )}

      {hydrated && list.length === 0 && (
        <p className="tile p-5 text-center text-dim">
          No phrases yet. Finish a conversation, or import a list from a book you&apos;re reading.
        </p>
      )}

      <ul className="space-y-2.5">
        {list.map((p) => {
          const key = `phrase:${p.text}`;
          const playing = player.state?.key === key;
          return (
            <li key={p.text} className="tile space-y-1.5 p-3.5">
              <div className="flex items-start gap-2">
                <p className="flex-1 font-extrabold">{p.text}</p>
                <button
                  type="button"
                  aria-label={playing ? `Stop ${p.text}` : `Listen to ${p.text}`}
                  onClick={() =>
                    playing ? player.stop() : void player.play(key, p.example || p.text, prefs.tutorVoiceId, 1)
                  }
                  className="grid size-9 place-items-center rounded-xl bg-elev-2 text-dim hover:text-text"
                >
                  {player.state?.key === key && player.state.status === "loading" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : playing ? (
                    <Square className="size-3.5 fill-current" />
                  ) : (
                    <Volume2 className="size-4" />
                  )}
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${p.text}`}
                  onClick={() => learner.removePhrase(p.text)}
                  className="grid size-9 place-items-center rounded-xl bg-elev-2 text-faint hover:text-bad"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              {p.meaningEn && <p className="text-sm text-dim">{p.meaningEn}</p>}
              {p.example && <p className="text-sm italic text-dim">“{p.example}”</p>}
              {p.meaningHe &&
                (openHe.has(p.text) || prefs.hebrewHelp ? (
                  <p dir="rtl" lang="he" className="text-sm">
                    {p.meaningHe}
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => setOpenHe(new Set(openHe).add(p.text))}
                    className="inline-flex items-center gap-1 text-sm font-extrabold text-accent"
                  >
                    <Languages className="size-4" aria-hidden /> Translate
                  </button>
                ))}
              <p className="text-xs font-bold text-faint">
                {dueLabel(p, now)}
                {p.usedCount ? ` · used ${p.usedCount}× in conversation` : ""}
                {p.tag ? ` · ${p.tag}` : ""}
              </p>
            </li>
          );
        })}
      </ul>
      {player.error && (
        <p role="alert" className="text-sm font-bold text-bad">
          The voice isn&apos;t available right now.
        </p>
      )}
    </div>
  );
}
