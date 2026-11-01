"use client";

import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { useLearner } from "@/lib/client/learner";
import { reportWaiting } from "@/lib/learner/model";
import { scenarioById } from "@/content/scenarios";

/** A finished conversation whose report was never made (closed too early, no network). */
export function ReportWaitingCard() {
  const state = useLearner();
  const session = reportWaiting(state);
  if (!session) return null;
  const title = scenarioById(session.scenarioId)?.title ?? "Your conversation";
  return (
    <section aria-labelledby="waiting-title" className="tile flex items-center gap-3 border-warn/50 p-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-warn/15 text-warn">
        <ClipboardList className="size-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <h2 id="waiting-title" className="font-extrabold">
          Your report isn&apos;t ready yet
        </h2>
        <p className="text-sm text-dim">{title}: the app closed before it was written.</p>
      </div>
      <Link href={`/report/${session.id}`} className="btn-3d btn-go shrink-0 px-4 py-2.5 text-sm">
        Make it
      </Link>
    </section>
  );
}
