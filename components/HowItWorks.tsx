"use client";

import { useState } from "react";
import { ChevronDown, Info } from "lucide-react";
import clsx from "clsx";

/** A small "How it works" toggle under a screen title: what to do, step by step, and why. */
export function HowItWorks({ steps, why }: { steps: string[]; why: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-1.5 text-sm font-extrabold text-accent"
      >
        <Info className="size-4" aria-hidden /> How it works
        <ChevronDown className={clsx("size-4 transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      {open && (
        <div className="mt-2 space-y-2 rounded-2xl bg-elev-2 p-3 text-sm">
          <ol className="space-y-1.5">
            {steps.map((s, i) => (
              <li key={s} className="flex gap-2">
                <span className="font-black text-accent">{i + 1}.</span>
                <span className="text-dim">{s}</span>
              </li>
            ))}
          </ol>
          <p className="font-bold">Why: {why}</p>
        </div>
      )}
    </div>
  );
}
