import { Mic } from "lucide-react";
import { ComingNext } from "@/components/ComingNext";

export default function PracticePage() {
  return (
    <ComingNext
      icon={Mic}
      title="Practice"
      body="Your first conversation with your tutor lands in the next build."
      bullets={[
        "Hands-free voice chat, or push-to-talk",
        "Quiet mode: type, and hear the reply in your earphones",
        "“I'm stuck” button: say it in Hebrew, get the English, say it back",
        "Slow down, repeat, hint, and “say it more naturally”",
      ]}
    />
  );
}
