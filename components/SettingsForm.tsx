"use client";

import Link from "next/link";
import { useState } from "react";
import { BookOpen, ChevronRight, Download, ShieldCheck, Trash2 } from "lucide-react";
import { learner } from "@/lib/client/learner";
import { usePrefs, type Prefs } from "@/lib/client/prefs";
import { voiceById } from "@/content/voices";
import { Segmented } from "./Segmented";
import { Avatar } from "./Avatar";
import { SyncSettings } from "./SyncSettings";
import { ReminderSettings } from "./ReminderSettings";
import { MemorySettings } from "./MemorySettings";
import { syncConfigured } from "@/lib/client/sync";

const CORRECTION_HELP: Record<Prefs["correctionMode"], string> = {
  off: "No corrections while you talk. Fixes appear only in the report. Good for building confidence.",
  gentle:
    "Your tutor repeats your sentence the right way inside the reply, without stopping you. What top apps do by default.",
  precise: "Your tutor points out each important mistake right away and asks you to say it again.",
};

export function SettingsForm({ budgetUsd }: { budgetUsd: number }) {
  const [prefs, setPrefs] = usePrefs();
  const voice = voiceById(prefs.tutorVoiceId);

  return (
    <div className="space-y-5">
      <Link href="/guide" className="tile flex items-center gap-3 p-4 transition-colors hover:border-accent/60">
        <span className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent">
          <BookOpen className="size-5" aria-hidden />
        </span>
        <span className="flex-1">
          <span className="block font-extrabold">How Speakwise works</span>
          <span className="block text-sm text-dim">The method, a weekly plan, and Hebrew-speaker traps</span>
        </span>
        <ChevronRight className="size-5 text-faint" aria-hidden />
      </Link>

      <Section title="Tutor">
        <Link
          href="/settings/voice"
          className="flex items-center gap-3 rounded-xl p-1 transition-colors hover:bg-elev-2"
        >
          {voice && <Avatar name={voice.displayName} size={40} />}
          <span className="flex-1">
            <span className="block font-extrabold">Voice: {voice?.displayName ?? "Not chosen"}</span>
            <span className="block text-sm text-dim">
              {voice ? `${voice.accent} · ${voice.vibe}` : "Pick from 8 voices"}
            </span>
          </span>
          <ChevronRight className="size-5 text-faint" aria-hidden />
        </Link>
        <Field label="Speaking speed" hint="You can also slow down any single sentence during a conversation.">
          <Segmented
            label="Speaking speed"
            value={prefs.speechRate}
            onChange={(v) => setPrefs({ speechRate: v })}
            options={[
              { value: 0.9, label: "Slower" },
              { value: 1, label: "Natural" },
              { value: 1.1, label: "Faster" },
            ]}
          />
        </Field>
      </Section>

      <Section title="Conversation">
        <Field label="Corrections during the conversation" hint={CORRECTION_HELP[prefs.correctionMode]}>
          <Segmented
            label="Correction style"
            value={prefs.correctionMode}
            onChange={(v) => setPrefs({ correctionMode: v })}
            options={[
              { value: "off", label: "Off" },
              { value: "gentle", label: "Gentle" },
              { value: "precise", label: "Precise" },
            ]}
          />
        </Field>
        <Field
          label="Hebrew help"
          hint={
            prefs.hebrewHelp
              ? "Explanations show a Hebrew translation right away."
              : "Everything stays in English. Tap Translate when you need it. “I'm stuck” always works."
          }
        >
          <Segmented
            label="Hebrew help"
            value={prefs.hebrewHelp ? "on" : "off"}
            onChange={(v) => setPrefs({ hebrewHelp: v === "on" })}
            options={[
              { value: "off", label: "Off (challenge)" },
              { value: "on", label: "On" },
            ]}
          />
        </Field>
        <Field label="Conversation length" hint="Your tutor wraps up gently when time is up.">
          <Segmented
            label="Conversation length"
            value={prefs.sessionMinutes}
            onChange={(v) => setPrefs({ sessionMinutes: v })}
            options={[
              { value: 5, label: "5 min" },
              { value: 10, label: "10 min" },
              { value: 15, label: "15 min" },
            ]}
          />
        </Field>
      </Section>

      <Section title="Daily goal">
        <Field label="Minutes of speaking per day" hint="Hitting it keeps your streak and earns bonus XP.">
          <Segmented
            label="Daily goal"
            value={prefs.dailyGoalMinutes}
            onChange={(v) => setPrefs({ dailyGoalMinutes: v })}
            options={[
              { value: 5, label: "5" },
              { value: 10, label: "10" },
              { value: 12, label: "12" },
              { value: 15, label: "15" },
              { value: 20, label: "20" },
            ]}
          />
        </Field>
      </Section>

      <Section title="Daily reminder">
        <ReminderSettings />
      </Section>

      <Section title="Services">
        <Link href="/setup" className="flex items-center gap-3 rounded-xl p-1 transition-colors hover:bg-elev-2">
          <span className="grid size-10 place-items-center rounded-xl bg-elev-2 text-accent">
            <ShieldCheck className="size-5" aria-hidden />
          </span>
          <span className="flex-1">
            <span className="block font-extrabold">Setup &amp; services</span>
            <span className="block text-sm text-dim">Speech, AI model and storage status</span>
          </span>
          <ChevronRight className="size-5 text-faint" aria-hidden />
        </Link>
        <p className="text-sm text-dim">
          Monthly spending cap: <span className="font-extrabold text-text">${budgetUsd}</span>. The app stops paid calls
          at the cap and warns you at 80%. Change it with MONTHLY_BUDGET_USD in Vercel.
        </p>
      </Section>

      <Section title="What your tutor remembers" id="memory">
        <MemorySettings />
      </Section>

      <Section title="Sync across devices">
        <SyncSettings />
      </Section>

      <DataControls />
    </div>
  );
}

/** Export is the backup; delete is final, and with sync on it also clears the other devices. */
function DataControls() {
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  function exportData() {
    const blob = new Blob([learner.exportJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `speakwise-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setDone("Backup downloaded.");
  }

  function deleteAll() {
    learner.reset();
    setConfirming(false);
    setDone(
      syncConfigured
        ? "All conversations, reports and progress were deleted. Signed-in devices clear on their next sync."
        : "All conversations, reports and progress were deleted from this device.",
    );
  }

  return (
    <Section title="Your data">
      <p className="text-sm text-dim">
        Conversations, reports and progress are stored on this device
        {syncConfigured ? ", and in your Supabase project when sync is on" : " only"}. Recordings are never stored:
        speech is turned into text and the audio is discarded.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={exportData}
          className="btn-3d btn-ghost flex items-center justify-center gap-2 py-2.5 text-sm"
        >
          <Download className="size-4" aria-hidden /> Export backup
        </button>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="btn-3d btn-ghost flex items-center justify-center gap-2 py-2.5 text-sm text-bad"
        >
          <Trash2 className="size-4" aria-hidden /> Delete all
        </button>
      </div>
      {confirming && (
        <div role="alertdialog" aria-labelledby="del-title" className="space-y-3 rounded-xl border-2 border-bad/50 p-3">
          <p id="del-title" className="font-extrabold">
            Delete everything? This can&apos;t be undone.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={deleteAll}
              className="btn-3d flex-1 bg-bad py-2 text-sm text-white"
              style={{ boxShadow: "0 4px 0 #9c1c33" }}
            >
              Yes, delete
            </button>
            <button type="button" onClick={() => setConfirming(false)} className="btn-3d btn-ghost flex-1 py-2 text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}
      {done && (
        <p role="status" className="text-sm font-bold text-good">
          {done}
        </p>
      )}
    </Section>
  );
}

function Section({ title, id, children }: { title: string; id?: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-label={title} className="tile scroll-mt-4 space-y-4 p-4">
      <h2 className="text-xs font-extrabold uppercase tracking-wider text-faint">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="font-extrabold">{label}</p>
      {children}
      <p className="text-sm text-dim">{hint}</p>
    </div>
  );
}
