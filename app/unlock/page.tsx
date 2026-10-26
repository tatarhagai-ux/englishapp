"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function UnlockForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/unlock", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code }),
    }).catch(() => null);
    setBusy(false);
    if (res?.ok) {
      const next = params.get("next");
      router.replace(next && next.startsWith("/") && !next.startsWith("//") ? next : "/");
      return;
    }
    setError(res?.status === 429 ? "Too many attempts. Try again in a few minutes." : "That code didn't work.");
  }

  return (
    <form onSubmit={submit} className="card w-full max-w-sm p-6">
      {/* eslint-disable-next-line @next/next/no-img-element -- a tiny static SVG */}
      <img src="/icon.svg" alt="" width={56} height={56} className="mb-5" />
      <h1 className="text-2xl font-semibold">Welcome back</h1>
      <p className="mt-1 text-sm text-dim">Enter your access code to open Speakwise.</p>
      <label htmlFor="code" className="sr-only">
        Access code
      </label>
      <input
        id="code"
        type="password"
        autoComplete="current-password"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="mt-5 w-full rounded-xl border border-line bg-elev-2 px-4 py-3 text-base outline-none focus:border-accent"
        placeholder="Access code"
        required
      />
      {error && (
        <p role="alert" className="mt-3 text-sm text-bad">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy || !code}
        className="accent-gradient mt-5 w-full rounded-xl py-3 font-semibold text-white disabled:opacity-50"
      >
        {busy ? "Checking..." : "Unlock"}
      </button>
    </form>
  );
}

export default function UnlockPage() {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <Suspense>
        <UnlockForm />
      </Suspense>
    </main>
  );
}
