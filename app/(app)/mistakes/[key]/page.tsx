import { MistakeLesson } from "@/components/MistakeLesson";

export default async function MistakePage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  return <MistakeLesson mistakeKey={decodeURIComponent(key)} />;
}
