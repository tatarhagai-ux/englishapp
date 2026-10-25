import Link from "next/link";
import { ChevronRight, Gauge, Headphones, Languages, MessageSquareWarning, ShieldCheck, Wallet } from "lucide-react";

const ROWS = [
  { href: "/settings/voice", icon: Headphones, title: "Tutor voice", detail: "Pick from 8 voices", ready: true },
  {
    href: "/setup",
    icon: ShieldCheck,
    title: "Setup & services",
    detail: "Speech, AI and storage status",
    ready: true,
  },
  { href: null, icon: MessageSquareWarning, title: "Correction style", detail: "Off, gentle or precise", ready: false },
  { href: null, icon: Languages, title: "Hebrew help", detail: "Off by default", ready: false },
  {
    href: null,
    icon: Gauge,
    title: "Speaking speed & session length",
    detail: "Coming with the first conversation",
    ready: false,
  },
  { href: null, icon: Wallet, title: "Monthly spending cap", detail: "$15 by default", ready: false },
];

export default function SettingsPage() {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <ul className="card divide-y divide-line overflow-hidden">
        {ROWS.map(({ href, icon: Icon, title, detail, ready }) => {
          const inner = (
            <>
              <span className="grid size-9 place-items-center rounded-xl bg-elev-2 text-accent">
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-medium">{title}</span>
                <span className="block text-xs text-dim">{detail}</span>
              </span>
              {ready ? (
                <ChevronRight className="size-5 text-faint" aria-hidden />
              ) : (
                <span className="rounded-full bg-elev-2 px-2 py-0.5 text-[10px] font-semibold uppercase text-faint">
                  Soon
                </span>
              )}
            </>
          );
          return (
            <li key={title}>
              {href ? (
                <Link href={href} className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-elev-2">
                  {inner}
                </Link>
              ) : (
                <div className="flex items-center gap-3 px-4 py-3.5 opacity-70">{inner}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
