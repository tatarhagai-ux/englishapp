import { NextResponse, type NextRequest } from "next/server";
import { GATE_COOKIE, gateConfig, isProductionDeploy, isValidGateToken } from "@/lib/auth/gate";

const PUBLIC_PATHS = ["/unlock", "/api/unlock", "/setup", "/api/health"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  const gate = gateConfig();
  if (!gate.enabled) {
    // Locally the gate is optional. On Vercel, paid endpoints stay closed until it is set.
    if (isProductionDeploy() && pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "gate_not_configured", message: "Set APP_ACCESS_CODE and APP_SESSION_SECRET first." },
        { status: 503 },
      );
    }
    return NextResponse.next();
  }

  const ok = await isValidGateToken(req.cookies.get(GATE_COOKIE)?.value, gate.secret);
  if (ok) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/unlock";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-touch-icon.png|icons/|manifest.webmanifest|sw.js|offline.html).*)",
  ],
};
