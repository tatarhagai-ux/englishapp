"use client";

import { useState } from "react";
import { Languages, Loader2, X } from "lucide-react";

export type HelperState =
  | { kind: "loading"; title: string }
  | { kind: "hint"; ideas: string[] }
  | { kind: "better"; original: string; better: string; why: string; whyHe: string }
  | { kind: "simplify"; simple: string; hebrew: string }
  | { kind: "error"; message: string };

const TITLES: Record<Exclude<HelperState["kind"], "loading">, string> = {
  hint: "You could start with…",
  better: "A more natural way to say it",
  simplify: "In simpler words",
  error: "Something went wrong",
};

/** Help card above the controls. Hebrew stays hidden behind a tap unless Hebrew help is on. */
export function HelperPanel({
  state,
  hebrewHelp,
  onClose,
}: {
  state: HelperState;
  hebrewHelp: boolean;
  onClose: () => void;
}) {
  const [showHe, setShowHe] = useState(hebrewHelp);
  const title = state.kind === "loading" ? state.title : TITLES[state.kind];
  const hebrew = state.kind === "better" ? state.whyHe : state.kind === "simplify" ? state.hebrew : "";

  return (
    <section className="tile relative mx-4 mb-3 p-4" aria-live="polite" aria-label={title}>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close help"
        className="absolute right-2 top-2 rounded-full p-1.5 text-faint hover:text-text"
      >
        <X className="size-4" />
      </button>
      <p className="pr-6 text-xs font-extrabold uppercase tracking-wider text-faint">{title}</p>
      {state.kind === "loading" && <Loader2 className="mt-2 size-5 animate-spin text-accent" aria-label="Loading" />}
      {state.kind === "hint" && (
        <ul className="mt-2 space-y-1.5">
          {state.ideas.map((i) => (
            <li key={i} className="font-bold">
              “{i}”
            </li>
          ))}
        </ul>
      )}
      {state.kind === "better" && (
        <div className="mt-2 space-y-1">
          <p className="text-sm text-bad line-through decoration-bad/60">{state.original}</p>
          <p className="font-extrabold text-good">{state.better}</p>
          <p className="text-sm text-dim">{state.why}</p>
          <p className="text-xs font-bold text-faint">Say it out loud once before you continue.</p>
        </div>
      )}
      {state.kind === "simplify" && <p className="mt-2 font-bold">{state.simple}</p>}
      {state.kind === "error" && <p className="mt-2 text-sm font-bold text-bad">{state.message}</p>}
      {hebrew &&
        (showHe ? (
          <p dir="rtl" lang="he" className="mt-2 rounded-lg bg-elev-2 px-2.5 py-1.5 text-sm">
            {hebrew}
          </p>
        ) : (
          <button
            type="button"
            onClick={() => setShowHe(true)}
            className="mt-2 inline-flex items-center gap-1 text-sm font-extrabold text-accent tap"
          >
            <Languages className="size-4" aria-hidden /> Translate
          </button>
        ))}
    </section>
  );
}
