import { env } from "@/lib/env";
import { ProgressView } from "@/components/ProgressView";

export const dynamic = "force-dynamic";

export default function ProgressPage() {
  return <ProgressView budgetUsd={env.MONTHLY_BUDGET_USD} />;
}
