import { notFound } from "next/navigation";
import { SAY_MISSES_ID, saySetById } from "@/content/say";
import { SayDrill, SayMisses } from "@/components/say/SayDrill";

export default async function SaySetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (id === SAY_MISSES_ID) return <SayMisses />;
  const set = saySetById(id);
  if (!set) notFound();
  return <SayDrill key={set.id} set={set} />;
}
