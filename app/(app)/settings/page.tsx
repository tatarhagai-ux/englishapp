import { env } from "@/lib/env";
import { SettingsForm } from "@/components/SettingsForm";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-black tracking-tight">Settings</h1>
      <SettingsForm budgetUsd={env.MONTHLY_BUDGET_USD} />
    </div>
  );
}
