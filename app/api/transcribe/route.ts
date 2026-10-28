import { NextResponse } from "next/server";
import { z } from "zod";
import { errorResponse } from "@/lib/http/errors";
import { sttConfigured, transcribe } from "@/lib/providers/stt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** About 3 MB of audio: far more than a minute of speech in Opus. */
const MAX_BASE64 = 4_000_000;

const body = z.object({
  audio: z.string().min(100).max(MAX_BASE64),
  format: z.enum(["webm", "ogg", "m4a", "wav", "mp3", "aac", "flac"]),
  language: z.enum(["en", "he"]).default("en"),
});

/** Whether accurate transcription is set up, so the app can choose before recording. */
export async function GET() {
  return NextResponse.json({ available: sttConfigured() });
}

/** One recorded answer in, its words out (with the cost, for the monthly budget). */
export async function POST(req: Request) {
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  try {
    const { audio, format, language } = parsed.data;
    const out = await transcribe({ audioBase64: audio, format, language, signal: req.signal });
    return NextResponse.json(out, { headers: { "cache-control": "no-store" } });
  } catch (err) {
    return errorResponse(err);
  }
}
