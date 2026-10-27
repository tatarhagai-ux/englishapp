"use client";

import { Check, X } from "lucide-react";
import clsx from "clsx";

/**
 * One multiple-choice question (listening stories, radio, short reads): pick once, then the
 * right answer turns green, a wrong pick red, and an optional line says why.
 */
export function QuizQuestion({
  number,
  q,
  options,
  answer,
  picked,
  why,
  onPick,
}: {
  number: number;
  q: string;
  options: readonly string[];
  answer: number;
  picked: number | null;
  why?: string;
  onPick: (option: number) => void;
}) {
  const show = picked !== null;
  return (
    <div className="tile space-y-2.5 p-4">
      <p className="font-extrabold">
        {number}. {q}
      </p>
      <div role="group" aria-label={q} className="grid gap-2">
        {options.map((o, oi) => {
          const isRight = oi === answer;
          return (
            <button
              key={o}
              type="button"
              onClick={() => onPick(oi)}
              disabled={show}
              className={clsx(
                "flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-left text-sm font-bold",
                !show && "border-line hover:border-accent/60",
                show && isRight && "border-go bg-go/10 text-good",
                show && picked === oi && !isRight && "border-bad bg-bad/10 text-bad",
                show && picked !== oi && !isRight && "border-line opacity-60",
              )}
            >
              {show && isRight && <Check className="size-4 shrink-0" aria-hidden />}
              {show && picked === oi && !isRight && <X className="size-4 shrink-0" aria-hidden />}
              {o}
            </button>
          );
        })}
      </div>
      {show && why && <p className="text-sm text-dim">{why}</p>}
    </div>
  );
}
