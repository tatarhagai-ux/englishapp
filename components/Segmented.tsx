"use client";

import clsx from "clsx";

interface Props<T extends string | number> {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
}

/** Pill group for picking one of a few options. Buttons with aria-pressed, keyboard friendly. */
export function Segmented<T extends string | number>({ label, value, options, onChange }: Props<T>) {
  return (
    <div role="group" aria-label={label} className="flex rounded-2xl border-2 border-line bg-elev-2 p-1">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={clsx(
            "flex-1 rounded-xl px-2 py-2 text-sm font-extrabold transition-colors",
            value === o.value ? "bg-accent text-white shadow-[0_3px_0_var(--accent-deep)]" : "text-dim hover:text-text",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
