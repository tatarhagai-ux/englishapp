/**
 * Restoring an exported backup. The backup is merged into what is already here rather than
 * replacing it, so restoring an older file never loses newer sessions, and the merge rules
 * are the same ones sync uses (lib/learner/merge.ts).
 */
import type { LearnerState } from "./model";
import { mergeStates } from "./merge";

export type BackupError = "not_json" | "not_backup";

export function parseBackup(text: string): { state: LearnerState } | { error: BackupError } {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { error: "not_json" };
  }
  const r = raw as Partial<LearnerState> | null;
  const isRecord = (v: unknown) => typeof v === "object" && v !== null && !Array.isArray(v);
  if (!isRecord(r) || r!.v !== 1 || !Array.isArray(r!.sessions) || !Array.isArray(r!.phrases) || !isRecord(r!.errors)) {
    return { error: "not_backup" };
  }
  return { state: { ...r, spend: isRecord(r!.spend) ? r!.spend : {} } as LearnerState };
}

export function restoreBackup(current: LearnerState, backup: LearnerState, now = new Date()): LearnerState {
  // The backup's own reset marker shouldn't wipe what came after it, and the restore marker
  // lifts any earlier "Delete all" (here and, through sync, on other devices).
  const restoredAt = now.toISOString();
  return mergeStates({ ...current, restoredAt }, { ...backup, resetAt: undefined, restoredAt });
}

export function backupSummary(s: LearnerState): string {
  const sessions = s.sessions.filter((x) => !x.demo && x.report).length;
  return `${sessions} conversation${sessions === 1 ? "" : "s"}, ${s.phrases.length} phrase${s.phrases.length === 1 ? "" : "s"}`;
}
