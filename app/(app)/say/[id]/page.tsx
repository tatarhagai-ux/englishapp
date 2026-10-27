import { notFound } from "next/navigation";
import { saySetById } from "@/content/say";
import { SayDrill } from "@/components/say/SayDrill";

export default async function SaySetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const set = saySetById(id);
  if (!set) notFound();
  return <SayDrill key={set.id} set={set} />;
}
