import { NextResponse } from "next/server";
import { NotConfiguredError } from "@/lib/env";
import { ProviderError } from "@/lib/providers/errors";

/** Map provider and config failures to stable JSON errors the client knows how to show. */
export function errorResponse(err: unknown) {
  if (err instanceof NotConfiguredError) {
    return NextResponse.json({ error: "not_configured", service: err.service }, { status: 503 });
  }
  if (err instanceof ProviderError) {
    const status = err.status === 401 || err.status === 403 ? 502 : err.status >= 500 ? 502 : err.status;
    return NextResponse.json({ error: "provider_error", provider: err.provider, status: err.status }, { status });
  }
  console.error(err);
  return NextResponse.json({ error: "internal_error" }, { status: 500 });
}
