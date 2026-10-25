import { describe, expect, it } from "vitest";
import { readSse } from "@/lib/providers/llm/sse";

function stream(chunks: string[]): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  return new ReadableStream({
    start(c) {
      chunks.forEach((s) => c.enqueue(enc.encode(s)));
      c.close();
    },
  });
}

async function collect(chunks: string[]) {
  const out: string[] = [];
  for await (const d of readSse(stream(chunks))) out.push(d);
  return out;
}

describe("readSse", () => {
  it("yields data payloads split across network chunks", async () => {
    expect(await collect(['data: {"a":', '1}\n\ndata: {"b":2}\n', "\n"])).toEqual(['{"a":1}', '{"b":2}']);
  });

  it("skips comments and stops at [DONE]", async () => {
    expect(await collect([": OPENROUTER PROCESSING\n\n", "data: x\n\n", "data: [DONE]\n\n", "data: y\n\n"])).toEqual([
      "x",
    ]);
  });

  it("handles CRLF line endings", async () => {
    expect(await collect(["data: one\r\n\r\ndata: two\r\n\r\n"])).toEqual(["one", "two"]);
  });
});
