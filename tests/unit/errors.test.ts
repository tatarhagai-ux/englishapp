import { afterEach, describe, expect, it, vi } from "vitest";
import { errorResponse } from "@/lib/http/errors";
import { ProviderError } from "@/lib/providers/errors";
import { analyzeSession, API_ERROR_TEXT, ApiError, kindFor } from "@/lib/client/api";

afterEach(() => vi.unstubAllGlobals());

describe("errors the learner can act on", () => {
  it("server: a rejected key and an empty balance get their own codes", async () => {
    const auth = errorResponse(new ProviderError("openrouter", 401, "bad key"));
    expect(auth.status).toBe(502);
    expect(await auth.json()).toMatchObject({ error: "provider_auth" });
    const credit = errorResponse(new ProviderError("openrouter", 402, "no credit"));
    expect(credit.status).toBe(402);
    expect(await credit.json()).toMatchObject({ error: "provider_credit" });
    expect((await errorResponse(new ProviderError("openrouter", 500, "x")).json()).error).toBe("provider_error");
  });

  it("client: reads the code and says what to do", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ error: "provider_auth" }), { status: 502 })),
    );
    await expect(analyzeSession("free-your-week", [])).rejects.toMatchObject({ kind: "provider_auth" });
    expect(API_ERROR_TEXT.provider_auth).toContain("OPENROUTER_API_KEY");
    expect(kindFor(402)).toBe("provider_credit");
    expect(kindFor(500)).toBe("provider");
  });

  it("client: tells offline apart from a server problem", async () => {
    vi.stubGlobal("navigator", { onLine: false });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      }),
    );
    const err = await analyzeSession("free-your-week", []).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).kind).toBe("offline");
  });
});
