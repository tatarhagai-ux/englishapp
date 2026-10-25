import { setupStatus } from "@/lib/env";
import { HomeDashboard } from "@/components/HomeDashboard";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const status = setupStatus();
  return <HomeDashboard ready={status.azure && status.llm} />;
}
