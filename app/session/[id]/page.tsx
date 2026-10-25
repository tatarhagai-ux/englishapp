import { notFound } from "next/navigation";
import { env } from "@/lib/env";
import { scenarioById } from "@/content/scenarios";
import { ConversationScreen } from "@/components/session/ConversationScreen";

export const dynamic = "force-dynamic";

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!scenarioById(id)) notFound();
  return <ConversationScreen scenarioId={id} budgetUsd={env.MONTHLY_BUDGET_USD} />;
}
