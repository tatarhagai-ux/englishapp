import { NextResponse } from "next/server";
import { NotConfiguredError } from "@/lib/env";
import { ProviderError } from "@/lib/providers/errors";

/** Map provider and config failures to stable JSON errors the client knows how to show. */
export function errorResponse(err: unknown) {
  if (err instanceof NotConfiguredError) {
    return NextResponse.json({ error: "not_configured", service: err.service }, { status: 503 });
  }
  if (err instanceof ProviderError) {
    // A rejected key and an empty balance can't be fixed by retrying, so the client gets
    // a distinct code for each and can say exactly what to do.
    if (err.status === 401 || err.status === 403) {
      return NextResponse.json({ error: "provider_auth", provider: err.provider }, { status: 502 });
    }
    if (err.status === 402) {
      return NextResponse.json({ error: "provider_credit", provider: err.provider }, { status: 402 });
    }
    const status = err.status >= 500 ? 502 : err.status;
    return NextResponse.json({ error: "provider_error", provider: err.provider, status: err.status }, { status });
  }
  console.error(err);
  return NextResponse.json({ error: "internal_error" }, { status: 500 });
}
