import { mergeStates } from "@/lib/learner/merge";
import type { LearnerState } from "@/lib/learner/model";

/** The two calls a sync needs, so tests can pass a fake. */
export interface SyncStore {
  pull(): Promise<LearnerState | null>;
  push(doc: LearnerState): Promise<void>;
}

/** JSON with object keys sorted, so the same content always compares equal. */
export function stableJson(value: unknown): string {
  return JSON.stringify(value, (_key, v: unknown) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)))
      : v,
  );
}

/** One round trip: pull, merge with the local copy, push back only if something changed. */
export async function syncOnce(local: LearnerState, store: SyncStore): Promise<LearnerState> {
  const remote = await store.pull();
  const merged = remote?.v === 1 ? mergeStates(local, remote) : local;
  if (!remote || stableJson(merged) !== stableJson(remote)) await store.push(merged);
  return merged;
}
