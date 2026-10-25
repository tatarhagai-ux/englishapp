import { NextResponse } from "next/server";
import { llmConfig } from "@/lib/env";
import { llm } from "@/lib/providers/llm";
import { errorResponse } from "@/lib/http/errors";
import { assistRequest, assistResult, buildAssistMessages } from "@/lib/prompts/assist";
import { extractJson } from "@/lib/prompts/analyzer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const parsed = assistRequest.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request", issues: parsed.error.issues }, { status: 400 });
  }
  try {
    const { chatModel } = llmConfig();
    const res = await llm().complete({
      model: chatModel,
      messages: buildAssistMessages(parsed.data),
      temperature: 0.4,
      maxTokens: 300,
      json: true,
      signal: req.signal,
    });
    const result = assistResult[parsed.data.mode].safeParse(extractJson(res.text));
    if (!result.success) return NextResponse.json({ error: "bad_model_output" }, { status: 502 });
    return NextResponse.json({ ...result.data, model: chatModel, usage: res.usage ?? null });
  } catch (err) {
    return errorResponse(err);
  }
}
