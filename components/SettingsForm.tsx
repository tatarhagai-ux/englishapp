"use client";

import Link from "next/link";
import { ChevronRight, ShieldCheck } from "lucide-react";
import { usePrefs, type Prefs } from "@/lib/client/prefs";
import { voiceById } from "@/content/voices";
import { Segmented } from "./Segmented";
import { Avatar } from "./Avatar";

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
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="tile space-y-4 p-4">
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
