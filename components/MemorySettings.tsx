"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { learner, useHydrated, useLearner } from "@/lib/client/learner";

/** What the tutor remembers from earlier conversations. Visible and deletable, one by one. */
export function MemorySettings() {
  const hydrated = useHydrated();
  const state = useLearner();
  const memory = hydrated ? [...(state.memory ?? [])].reverse() : [];
  const [draft, setDraft] = useState("");
  const add = () => {
    if (draft.trim().length < 3) return;
    learner.addFact(draft);
    setDraft("");
  };
  return (
    <div className="space-y-3">
      <p className="text-sm text-dim">
        After each conversation, your tutor keeps what you shared (plans, work, interests, the numbers you mentioned),
        updates what changed, and builds on it next time. Health and ID numbers are never kept. You can add a fact
        yourself or delete anything.
      </p>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <label htmlFor="memory-add" className="sr-only">
          Something your tutor should know
        </label>
        <input
          id="memory-add"
          value={draft}
          maxLength={160}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="He is reading Never Split the Difference."
          className="min-w-0 flex-1 rounded-xl border-2 border-line bg-elev px-3 py-2 text-sm"
        />
        <button type="submit" className="btn-3d btn-ghost flex items-center gap-1 px-3 py-2 text-sm">
          <Plus className="size-4" aria-hidden /> Add
        </button>
      </form>
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
