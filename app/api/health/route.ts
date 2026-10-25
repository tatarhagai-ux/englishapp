import { NextResponse } from "next/server";
import { setupStatus } from "@/lib/env";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ ok: true, services: setupStatus() });
}
