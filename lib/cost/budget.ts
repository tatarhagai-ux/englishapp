/** Monthly spending cap. Pure logic so it is easy to test; persistence comes from the DB. */

export type BudgetState = "ok" | "warning" | "blocked";

export const WARNING_RATIO = 0.8;

export function budgetState(spentUsd: number, capUsd: number): BudgetState {
  if (capUsd <= 0) return "blocked";
  if (spentUsd >= capUsd) return "blocked";
  if (spentUsd >= capUsd * WARNING_RATIO) return "warning";
  return "ok";
}

/** Would this request push spend over the cap? Uses an estimate before the call. */
export function canSpend(spentUsd: number, capUsd: number, estimatedUsd: number): boolean {
  return spentUsd + Math.max(0, estimatedUsd) <= capUsd;
}

export function monthKey(date: Date = new Date()): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}
