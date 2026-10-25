import { NextResponse } from "next/server";
import { z } from "zod";
import { speech } from "@/lib/providers/speech";
import { errorResponse } from "@/lib/http/errors";
import { voiceById } from "@/content/voices";

export const runtime = "nodejs";

const MAX_CHARS = 600;

const body = z.object({
  text: z.string().trim().min(1).max(MAX_CHARS),
  voiceId: z.string().min(1),
  rate: z.number().min(0.5).max(1.5).optional(),
});

export async function POST(req: Request) {
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request", issues: parsed.error.issues }, { status: 400 });
  }
  const voice = voiceById(parsed.data.voiceId);
  if (!voice) return NextResponse.json({ error: "unknown_voice" }, { status: 400 });

  try {
    const out = await speech().synthesize({
      text: parsed.data.text,
      voice: voice.azureName,
      locale: voice.locale,
      rate: parsed.data.rate,
    });
    return new Response(out.audio, {
      headers: {
        "content-type": out.contentType,
        "cache-control": "private, max-age=86400",
        "x-billable-chars": String(out.characters),
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
