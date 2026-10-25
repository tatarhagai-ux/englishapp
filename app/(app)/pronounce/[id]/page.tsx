import { notFound } from "next/navigation";
import { unitById } from "@/content/pronunciation";
import { PronunciationUnitView } from "@/components/pronounce/PronunciationUnitView";

export default async function PronounceUnitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const unit = unitById(id);
  if (!unit) notFound();
  return <PronunciationUnitView unit={unit} />;
}
