import { NextResponse } from "next/server";
import { z } from "zod";
import { serverSyncConfigured, supabaseStore } from "@/lib/sync/server";
import { syncOnce } from "@/lib/sync/merge-store";
import type { LearnerState } from "@/lib/learner/model";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The learner model is validated where it's used; here only its version is checked.
const body = z.object({ doc: z.object({ v: z.literal(1) }).passthrough() });

/** Behind the access code (middleware). Merges this device's copy with the stored one. */
export async function POST(req: Request) {
  if (!serverSyncConfigured()) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  try {
    const doc = await syncOnce(parsed.data.doc as unknown as LearnerState, supabaseStore);
    return NextResponse.json({ doc });
  } catch (err) {
    const message = (err as Error).message;
    return NextResponse.json({ error: message }, { status: message === "sync_forbidden" ? 403 : 502 });
  }
}
