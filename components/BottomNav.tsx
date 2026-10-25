"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Home, Mic, Settings } from "lucide-react";
import clsx from "clsx";

const ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/practice", label: "Practice", icon: Mic },
  { href: "/progress", label: "Progress", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/85 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-xl justify-around px-2">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "flex min-w-16 flex-col items-center gap-1 px-3 py-2.5 text-[11px] font-medium transition-colors",
                  active ? "text-text" : "text-faint hover:text-dim",
                )}
              >
                <span
                  className={clsx(
                    "grid h-8 w-14 place-items-center rounded-full transition-colors",
                    active && "bg-accent-soft text-accent",
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
