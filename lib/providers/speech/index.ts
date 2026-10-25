import "server-only";
import { requireAzure } from "@/lib/env";
import { createAzureSpeech } from "./azure";
import type { SpeechProvider } from "./types";

let cached: SpeechProvider | null = null;

export function speech(): SpeechProvider {
  cached ??= createAzureSpeech(requireAzure());
  return cached;
}

export * from "./types";
