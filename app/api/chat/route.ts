import { NextResponse } from "next/server";
import { llmConfig } from "@/lib/env";
import { llm, type ChatStreamEvent } from "@/lib/providers/llm";
import { errorResponse } from "@/lib/http/errors";
import { chatRequest } from "@/lib/conversation/types";
import { buildTutorSystemPrompt, toChatMessages, trimHistory } from "@/lib/prompts/tutor";
import { scenarioById } from "@/content/scenarios";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Streams the tutor's reply as NDJSON lines: {"t":"delta","text":...} then
 * {"t":"done","usage":...}. The first event is awaited before responding, so config and
 * provider failures still come back as proper HTTP errors instead of a broken stream.
 */
export async function POST(req: Request) {
  const parsed = chatRequest.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request", issues: parsed.error.issues }, { status: 400 });
  }
  const body = parsed.data;
  const scenario = scenarioById(body.scenarioId);
  if (!scenario) return NextResponse.json({ error: "unknown_scenario" }, { status: 400 });

  let iterator: AsyncIterator<ChatStreamEvent>;
  let first: IteratorResult<ChatStreamEvent>;
  let model: string;
  try {
    const cfg = llmConfig();
    model = cfg.chatModel;
    const system = buildTutorSystemPrompt({
      scenario,
      tutorName: body.tutorName,
      correctionMode: body.correctionMode,
      targetKeys: body.targetKeys,
      wrapUp: body.wrapUp,
    });
    iterator = llm()
      .stream({
        model,
        messages: toChatMessages(system, trimHistory(body.history)),
        temperature: 0.8,
        maxTokens: 180,
        signal: req.signal,
      })
      [Symbol.asyncIterator]();
    first = await iterator.next();
  } catch (err) {
    return errorResponse(err);
  }

  const encoder = new TextEncoder();
  const line = (obj: unknown) => encoder.encode(`${JSON.stringify(obj)}\n`);
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        let result = first;
        while (!result.done) {
          const ev = result.value;
          if (ev.type === "delta") controller.enqueue(line({ t: "delta", text: ev.text }));
          else controller.enqueue(line({ t: "done", model, usage: ev.usage ?? null }));
          result = await iterator.next();
        }
      } catch (err) {
        console.error("chat stream failed", err);
        controller.enqueue(line({ t: "error" }));
      } finally {
        controller.close();
      }
    },
    cancel() {
      void iterator.return?.();
    },
  });

  return new Response(stream, {
    headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store" },
  });
}
