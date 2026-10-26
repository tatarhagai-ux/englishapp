"use client";

import { useState } from "react";
import { ChevronDown, Target } from "lucide-react";
import clsx from "clsx";

/**
 * The mission and its phrases stay one tap away during the conversation, so the goal
 * isn't forgotten after the intro screen. Collapsed by default to keep the chat in view.
 */
export function MissionBar({ task, phrases }: { task: string; phrases: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mx-4 mt-2 rounded-xl border-2 border-line bg-elev">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm"
      >
        <Target className="size-4 shrink-0 text-accent" aria-hidden />
        <span className={clsx("flex-1 font-bold", !open && "truncate")}>{task}</span>
        <ChevronDown
          className={clsx("size-4 shrink-0 text-dim transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>
      {open && phrases.length > 0 && (
        <ul className="flex flex-wrap gap-1.5 px-3 pb-3" aria-label="Phrases to try">
          {phrases.map((p) => (
            <li key={p} className="rounded-lg bg-elev-2 px-2 py-1 text-xs font-bold">
              {p}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
