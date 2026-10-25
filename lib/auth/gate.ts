/**
 * Single-user access gate. Until Supabase auth lands, this keeps strangers who find the
 * Vercel URL from spending the Azure/OpenRouter credit. The cookie holds an HMAC of a
 * fixed payload, so it can be verified in middleware (Edge runtime) with Web Crypto only.
 */

export const GATE_COOKIE = "sw_gate";
export const GATE_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;
const PAYLOAD = "speakwise-gate-v1";

const encoder = new TextEncoder();

async function hmac(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Constant-time string comparison, so a wrong guess leaks nothing through timing. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function gateToken(secret: string): Promise<string> {
  return hmac(secret, PAYLOAD);
}

export async function isValidGateToken(token: string | undefined, secret: string): Promise<boolean> {
  if (!token) return false;
  return safeEqual(token, await gateToken(secret));
}

export function gateConfig() {
  const code = process.env.APP_ACCESS_CODE;
  const secret = process.env.APP_SESSION_SECRET;
  const enabled = Boolean(code && code.length >= 6 && secret && secret.length >= 32);
  return { enabled, code: code ?? "", secret: secret ?? "" };
}

/** Production deploys must not expose paid APIs without the gate. */
export function isProductionDeploy(): boolean {
  return process.env.VERCEL_ENV === "production" || process.env.VERCEL_ENV === "preview";
}
