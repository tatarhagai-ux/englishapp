import "server-only";
import { buildSsml } from "@/lib/text/ssml";
import { ProviderError, type SpeechProvider, type SynthesizeRequest } from "./types";

const OUTPUT_FORMAT = "audio-24khz-48kbitrate-mono-mp3";
// Azure tokens live 10 minutes; refresh a little early on the client.
const TOKEN_TTL_MS = 9 * 60 * 1000;
const TIMEOUT_MS = 15_000;

export function createAzureSpeech(cfg: { key: string; region: string }): SpeechProvider {
  const base = `https://${cfg.region}`;

  async function call(url: string, init: RequestInit): Promise<Response> {
    const res = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) }).catch((err: unknown) => {
      const timedOut = err instanceof DOMException && err.name === "TimeoutError";
      throw new ProviderError("azure", timedOut ? 504 : 502, timedOut ? "request timed out" : "network error");
    });
    if (!res.ok) {
      const detail = (await res.text().catch(() => "")).slice(0, 200);
      throw new ProviderError("azure", res.status, detail || res.statusText);
    }
    return res;
  }

  return {
    name: "azure",

    async synthesize(req: SynthesizeRequest) {
      const res = await call(`${base}.tts.speech.microsoft.com/cognitiveservices/v1`, {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": cfg.key,
          "Content-Type": "application/ssml+xml",
          "X-Microsoft-OutputFormat": OUTPUT_FORMAT,
          "User-Agent": "speakwise",
        },
        body: buildSsml(req),
      });
      return { audio: await res.arrayBuffer(), contentType: "audio/mpeg", characters: req.text.length };
    },

    async issueBrowserToken() {
      const res = await call(`${base}.api.cognitive.microsoft.com/sts/v1.0/issueToken`, {
        method: "POST",
        headers: { "Ocp-Apim-Subscription-Key": cfg.key, "Content-Length": "0" },
      });
      return { token: await res.text(), region: cfg.region, expiresAt: Date.now() + TOKEN_TTL_MS };
    },
  };
}
