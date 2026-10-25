import Link from "next/link";
import { ChevronRight, Headphones, ShieldCheck } from "lucide-react";

// Only settings that work today. Correction style, Hebrew help, speed and the spending cap
// join this list together with the conversation screen that uses them.
const ROWS = [
  { href: "/settings/voice", icon: Headphones, title: "Tutor voice", detail: "Pick from 8 voices" },
  { href: "/setup", icon: ShieldCheck, title: "Setup & services", detail: "Speech, AI and storage status" },
];

export default function SettingsPage() {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <ul className="card divide-y divide-line overflow-hidden">
        {ROWS.map(({ href, icon: Icon, title, detail }) => (
          <li key={title}>
            <Link href={href} className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-elev-2">
              <span className="grid size-9 place-items-center rounded-xl bg-elev-2 text-accent">
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-medium">{title}</span>
                <span className="block text-xs text-dim">{detail}</span>
              </span>
              <ChevronRight className="size-5 text-faint" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
