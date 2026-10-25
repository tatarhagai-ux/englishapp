import { NextResponse } from "next/server";
import { speech } from "@/lib/providers/speech";
import { errorResponse } from "@/lib/http/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Hands the browser a 10-minute Azure token so real-time STT runs client-side. */
export async function POST() {
  try {
    const token = await speech().issueBrowserToken();
    return NextResponse.json(token, { headers: { "cache-control": "no-store" } });
  } catch (err) {
    return errorResponse(err);
  }
}
