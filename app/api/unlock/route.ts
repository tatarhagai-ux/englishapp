import { NextResponse } from "next/server";
import { z } from "zod";
import { GATE_COOKIE, GATE_MAX_AGE_SECONDS, gateConfig, gateToken, safeEqual } from "@/lib/auth/gate";

const body = z.object({ code: z.string().min(1).max(200) });

// Small in-memory brake on guessing. Serverless instances are short-lived, so this only
// slows a burst down; the code itself should be long enough not to be guessable.
const attempts = new Map<string, { count: number; first: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 10;

export async function POST(req: Request) {
  const gate = gateConfig();
  if (!gate.enabled) return NextResponse.json({ ok: true, gate: "disabled" });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const now = Date.now();
  const entry = attempts.get(ip);
  if (entry && now - entry.first < WINDOW_MS && entry.count >= MAX_ATTEMPTS) {
    return NextResponse.json({ error: "too_many_attempts" }, { status: 429 });
  }

  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success || !safeEqual(parsed.data.code.trim(), gate.code)) {
    const fresh = !entry || now - entry.first >= WINDOW_MS;
    attempts.set(ip, fresh ? { count: 1, first: now } : { count: entry.count + 1, first: entry.first });
    return NextResponse.json({ error: "wrong_code" }, { status: 401 });
  }

  attempts.delete(ip);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(GATE_COOKIE, await gateToken(gate.secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: GATE_MAX_AGE_SECONDS,
  });
  return res;
}
