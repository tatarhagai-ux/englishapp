"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Home, Mic, Settings } from "lucide-react";
import clsx from "clsx";

/** Each tab also owns the screens you reach from it, so the bar shows where you are. */
const ITEMS = [
  { href: "/", label: "Home", icon: Home, also: [] },
  { href: "/practice", label: "Practice", icon: Mic, also: ["/listen", "/pronounce", "/review", "/words"] },
  { href: "/progress", label: "Progress", icon: BarChart3, also: ["/phrases", "/mistakes"] },
  { href: "/settings", label: "Settings", icon: Settings, also: ["/guide"] },
] as const;

function isActive(pathname: string, href: string, also: readonly string[]) {
  if (href === "/") return pathname === "/";
  return [href, ...also].some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-line bg-bg/90 backdrop-blur-xl lg:inset-y-0 lg:right-auto lg:w-56 lg:border-r-2 lg:border-t-0 lg:px-3 lg:pt-8"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-xl justify-around px-2 lg:max-w-none lg:flex-col lg:justify-start lg:gap-1 lg:px-0">
        {ITEMS.map(({ href, label, icon: Icon, also }) => {
          const active = isActive(pathname, href, also);
          return (
            <li key={href} className="lg:w-full">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "flex min-w-16 flex-col items-center gap-1 px-3 py-2.5 text-[11px] font-extrabold transition-colors lg:flex-row lg:gap-3 lg:rounded-2xl lg:px-3 lg:py-2 lg:text-sm",
                  active ? "text-text" : "text-faint hover:text-dim",
                )}
              >
                <span
                  className={clsx(
                    "grid h-8 w-14 place-items-center rounded-full transition-colors lg:w-10",
                    active && "bg-accent-soft text-accent ring-2 ring-accent/30",
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
