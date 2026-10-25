import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  title: string;
  body: string;
  bullets: string[];
}

/** Honest placeholder for screens that land in the next build steps. */
export function ComingNext({ icon: Icon, title, body, bullets }: Props) {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-black tracking-tight">{title}</h1>
      <section className="card p-6 text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-3xl bg-accent shadow-[0_5px_0_var(--accent-deep)]">
          <Icon className="size-8 text-white" aria-hidden />
        </div>
        <p className="mx-auto mt-4 max-w-sm text-dim">{body}</p>
        <ul className="mx-auto mt-5 max-w-sm space-y-2 text-left text-sm">
          {bullets.map((b) => (
            <li key={b} className="flex gap-2 rounded-xl bg-elev-2 px-3 py-2">
              <span className="text-accent">•</span>
              {b}
            </li>
          ))}
        </ul>
        <Link href="/settings/voice" className="mt-6 inline-block text-sm font-semibold text-accent">
          Meanwhile, pick your tutor&apos;s voice →
        </Link>
      </section>
    </div>
  );
}
