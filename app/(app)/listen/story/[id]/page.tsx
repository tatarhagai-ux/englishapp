import { notFound } from "next/navigation";
import { storyById } from "@/content/stories";
import { StoryPlayer } from "@/components/listen/StoryPlayer";

export default async function StoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const story = storyById(id);
  if (!story) notFound();
  return <StoryPlayer story={story} />;
}
