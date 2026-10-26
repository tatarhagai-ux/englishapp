import { notFound } from "next/navigation";
import { readingById } from "@/content/readings";
import { Reader } from "@/components/read/Reader";

export default async function ReadingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reading = readingById(id);
  if (!reading) notFound();
  return <Reader reading={reading} />;
}
