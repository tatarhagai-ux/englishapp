import { BarChart3 } from "lucide-react";
import { ComingNext } from "@/components/ComingNext";

export default function ProgressPage() {
  return (
    <ComingNext
      icon={BarChart3}
      title="Progress"
      body="Once you start talking, this is where you'll see your English change week by week."
      bullets={[
        "Level per skill: fluency, grammar, vocabulary, pronunciation",
        "Your recurring mistakes and how fast they disappear",
        "Minutes spoken, streaks and achievements",
      ]}
    />
  );
}
