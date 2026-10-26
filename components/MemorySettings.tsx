"use client";

import { X } from "lucide-react";
import { learner, useHydrated, useLearner } from "@/lib/client/learner";

/** What the tutor remembers from earlier conversations. Visible and deletable, one by one. */
export function MemorySettings() {
  const hydrated = useHydrated();
  const state = useLearner();
  const memory = hydrated ? [...(state.memory ?? [])].reverse() : [];
  return (
    <div className="space-y-3">
      <p className="text-sm text-dim">
        After each conversation, your tutor keeps a few facts you shared (plans, work, exams) and asks about them next
        time. Nothing sensitive is kept, and you can delete anything.
      </p>
      {memory.length === 0 ? (
        <p className="text-sm font-bold text-faint">Nothing yet. It fills up as you talk.</p>
      ) : (
        <ul className="space-y-2">
          {memory.map((m) => (
            <li key={m.text} className="flex items-start gap-2 rounded-xl bg-elev-2 px-3 py-2 text-sm">
              <span className="flex-1">{m.text}</span>
              <button
                type="button"
                onClick={() => learner.forgetFact(m.text)}
                aria-label={`Forget: ${m.text}`}
                className="grid size-6 shrink-0 place-items-center rounded-md text-dim hover:text-bad"
              >
                <X className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
