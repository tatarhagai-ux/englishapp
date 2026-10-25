"use client";

import { useEffect, useRef, useState } from "react";
import { Eye } from "lucide-react";
import clsx from "clsx";
import type { Turn } from "@/lib/conversation/types";
import { Avatar } from "../Avatar";

interface Props {
  turns: Turn[];
  speakerName: string;
  /** Tutor text still streaming in. */
  pendingTutor: string;
  /** Live caption of what the learner is saying right now. */
  partial: string;
  /** Hide the other side's text so the turn is listening practice. Tap a bubble to reveal. */
  hideTutorText: boolean;
}

/** "Quick fix:" lines (precise mode) get the correction highlighted. */
function renderTutor(text: string) {
  const m = /^Quick fix:\s*"([^"]+)"\s*([\s\S]*)$/.exec(text);
  if (!m) return text;
  return (
    <>
      <span className="mb-1 block rounded-lg bg-go/15 px-2 py-1 font-extrabold text-good">✓ {m[1]}</span>
      {m[2]}
    </>
  );
}

export function Transcript({ turns, speakerName, pendingTutor, partial, hideTutorText }: Props) {
  const end = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns.length, pendingTutor, partial]);

  return (
    <div className="space-y-3" aria-live="polite">
      {turns.map((t, i) =>
        t.role === "tutor" ? (
          <div key={i} className="flex items-end gap-2">
            <Avatar name={speakerName} size={30} />
            {hideTutorText && !revealed.has(i) ? (
              <button
                type="button"
                onClick={() => setRevealed(new Set(revealed).add(i))}
                className="flex items-center gap-2 rounded-2xl rounded-bl-md border-2 border-dashed border-line px-3.5 py-2.5 text-sm font-bold text-dim"
              >
                <Eye className="size-4" aria-hidden /> Tap to show text
              </button>
            ) : (
              <p className="max-w-[85%] rounded-2xl rounded-bl-md border-2 border-line bg-elev px-3.5 py-2.5 leading-relaxed">
                {renderTutor(t.text)}
              </p>
            )}
          </div>
        ) : (
          <p
            key={i}
            dir={t.input === "stuck" ? "rtl" : "auto"}
            lang={t.input === "stuck" ? "he" : "en"}
            className={clsx(
              "ml-auto max-w-[85%] rounded-2xl rounded-br-md px-3.5 py-2.5 leading-relaxed",
              t.input === "stuck" ? "bg-warn/20 text-text" : "bg-accent text-white",
            )}
          >
            {t.text}
          </p>
        ),
      )}
      {pendingTutor && (
        <div className="flex items-end gap-2">
          <Avatar name={speakerName} size={30} />
          <p className="max-w-[85%] rounded-2xl rounded-bl-md border-2 border-line bg-elev px-3.5 py-2.5 leading-relaxed">
            {hideTutorText ? "…" : pendingTutor}
          </p>
        </div>
      )}
      {partial && (
        <p
          dir="auto"
          className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-accent/40 px-3.5 py-2.5 italic text-white"
        >
          {partial}
        </p>
      )}
      <div ref={end} />
    </div>
  );
}
