"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { History } from "lucide-react";
import { learner, useLearner } from "@/lib/client/learner";
import { unfinishedSession } from "@/lib/learner/model";
import { scenarioById } from "@/content/scenarios";

/** A conversation that was cut off: pick it up, or get the report for what was said. */
export function UnfinishedCard() {
  const state = useLearner();
  const router = useRouter();
  const found = unfinishedSession(state);
  const scenario = found ? scenarioById(found.session.scenarioId) : undefined;
  if (!found || !scenario) return null;
  const { session, resumable } = found;
  const replies = session.turns.filter((t) => t.role === "learner").length;
  const resumeHref = `/session/${session.scenarioId}${session.planDay ? `?plan=${session.planDay}` : ""}`;

  function report() {
    learner.finishSession(session.id);
    router.push(`/report/${session.id}`);
  }

  return (
    <section aria-labelledby="unfinished-title" className="tile space-y-3 border-warn/50 p-4">
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-warn/15 text-warn">
          <History className="size-5" aria-hidden />
        </span>
        <div className="flex-1">
          <h2 id="unfinished-title" className="font-extrabold">
            Unfinished conversation
          </h2>
          <p className="text-sm text-dim">
            {scenario.title} · {replies} replies. {resumable ? "Pick it up, or" : "You can still"} get your report.
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        {resumable && (
          <Link href={resumeHref} className="btn-3d btn-go flex-1 py-2.5 text-center text-sm">
            Resume
          </Link>
        )}
        <button
          type="button"
          onClick={report}
          className={`btn-3d flex-1 py-2.5 text-sm ${resumable ? "btn-ghost" : "btn-accent"}`}
        >
          Get the report
        </button>
      </div>
    </section>
  );
}
