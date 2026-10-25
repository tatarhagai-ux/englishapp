"use client";

import { motion, useReducedMotion } from "motion/react";

export type OrbState = "idle" | "listening" | "thinking" | "speaking";

const LABEL: Record<OrbState, string> = {
  idle: "Your turn",
  listening: "Listening…",
  thinking: "Thinking…",
  speaking: "Speaking…",
};

/** A small animated presence: breathes while listening, pulses while the other side talks. */
export function Orb({ state, size = 72, showLabel = true }: { state: OrbState; size?: number; showLabel?: boolean }) {
  const reduce = useReducedMotion();
  const animate =
    reduce || state === "idle"
      ? { scale: 1 }
      : state === "speaking"
        ? { scale: [1, 1.12, 0.96, 1.08, 1] }
        : state === "listening"
          ? { scale: [1, 1.05, 1] }
          : { rotate: 360 };
  return (
    <div className="flex flex-col items-center gap-2" role="status" aria-label={LABEL[state]}>
      <motion.div
        aria-hidden
        className="rounded-full"
        style={{
          width: size,
          height: size,
          background:
            state === "listening"
              ? "radial-gradient(circle at 35% 30%, #8ef5c4, var(--go) 55%, var(--go-deep))"
              : "radial-gradient(circle at 35% 30%, #b9a8ff, var(--accent) 55%, var(--accent-deep))",
          boxShadow: state === "listening" ? "0 0 40px rgba(47,191,113,0.45)" : "0 0 40px rgba(124,92,255,0.45)",
        }}
        animate={animate}
        transition={{
          duration: state === "thinking" ? 2 : 1.4,
          repeat: state === "idle" ? 0 : Infinity,
          ease: "easeInOut",
        }}
      />
      {showLabel && <span className="text-xs font-extrabold uppercase tracking-wider text-dim">{LABEL[state]}</span>}
    </div>
  );
}
