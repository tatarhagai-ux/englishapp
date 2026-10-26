import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** The commit that is live now. The app compares it with the one it was loaded from. */
export function GET() {
  return NextResponse.json(
    { version: process.env.VERCEL_GIT_COMMIT_SHA ?? "dev" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
