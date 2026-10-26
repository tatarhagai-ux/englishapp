"use client";

import Link from "next/link";
import { useState } from "react";
import { Cloud, CloudOff, LogOut, RefreshCw } from "lucide-react";
import {
  sendSignInEmail,
  setPassword,
  signInWithPassword,
  signOut,
  syncNow,
  useSyncStatus,
  verifySignInCode,
} from "@/lib/client/sync";

/** Sign in once on each device and progress follows you between phone and computer. */
export function SyncSettings() {
  const status = useSyncStatus();

  if (status.kind === "off") {
    return (
      <div className="flex gap-3">
        <CloudOff className="mt-0.5 size-5 shrink-0 text-faint" aria-hidden />
        <p className="text-sm text-dim">
          Progress is saved on this device only. To use the same progress on your phone and computer, connect Supabase
          (free) on the{" "}
          <Link href="/setup" className="font-extrabold text-accent">
            setup page
          </Link>
          .
        </p>
      </div>
    );
  }

  if (status.kind === "signed-out") return <SignIn />;

  const when = status.lastSyncedAt
    ? new Date(status.lastSyncedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Cloud className="size-5 shrink-0 text-good" aria-hidden />
        <p className="flex-1 text-sm">
          <span className="block font-extrabold">On for {status.email}</span>
          <span role="status" className="block text-dim">
            {status.kind === "syncing"
              ? "Syncing…"
              : status.kind === "error"
                ? status.message
                : `Up to date${when ? ` · ${when}` : ""}`}
          </span>
        </p>
      </div>
      <p className="text-sm text-dim">
        Sign in with the same email on your other devices. Conversations, mistakes, phrases and listening progress merge
        automatically.
      </p>
      <PasswordForm />
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => void syncNow()}
          disabled={status.kind === "syncing"}
          className="btn-3d btn-ghost flex items-center justify-center gap-2 py-2.5 text-sm"
        >
          <RefreshCw className={`size-4 ${status.kind === "syncing" ? "animate-spin" : ""}`} aria-hidden /> Sync now
        </button>
        <button
          type="button"
          onClick={() => void signOut()}
          className="btn-3d btn-ghost flex items-center justify-center gap-2 py-2.5 text-sm"
        >
          <LogOut className="size-4" aria-hidden /> Sign out
        </button>
      </div>
    </div>
  );
}

/** Lets a signed-in user pick a password, so other devices can sign in without an email. */
function PasswordForm() {
  const [open, setOpen] = useState(false);
  const [password, setPasswordText] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      await setPassword(password);
      setPasswordText("");
      setMessage({ ok: true, text: "Password saved. Use it with your email on any device." });
    } catch (err) {
      setMessage({ ok: false, text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-sm font-extrabold text-accent">
        Set a password for other devices
      </button>
    );
  }
  return (
    <form onSubmit={save} className="space-y-2">
      <label htmlFor="sync-new-password" className="text-sm font-extrabold">
        Password for signing in
      </label>
      <div className="flex gap-2">
        <input
          id="sync-new-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPasswordText(e.target.value)}
          placeholder="At least 8 characters"
          className="min-w-0 flex-1 rounded-xl border-2 border-line bg-elev-2 px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <button type="submit" disabled={busy || password.length === 0} className="btn-3d btn-accent px-4 py-2 text-sm">
          Save
        </button>
      </div>
      {message && (
        <p
          role={message.ok ? "status" : "alert"}
          className={`text-sm font-bold ${message.ok ? "text-good" : "text-bad"}`}
        >
          {message.text}
        </p>
      )}
    </form>
  );
}

function SignIn() {
  const [method, setMethod] = useState<"password" | "link">("password");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await sendSignInEmail(email.trim());
      setSentTo(email.trim());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function signInPw(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signInWithPassword(email.trim(), pw);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (!sentTo) return;
    setBusy(true);
    setError(null);
    try {
      await verifySignInCode(sentTo, code.trim());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-dim">Sign in to keep the same progress on your phone and computer.</p>
      {method === "password" ? (
        <form onSubmit={signInPw} className="space-y-2">
          <label htmlFor="sync-email" className="sr-only">
            Email
          </label>
          <input
            id="sync-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border-2 border-line bg-elev-2 px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <label htmlFor="sync-password" className="sr-only">
            Password
          </label>
          <div className="flex gap-2">
            <input
              id="sync-password"
              type="password"
              required
              autoComplete="current-password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="Password"
              className="min-w-0 flex-1 rounded-xl border-2 border-line bg-elev-2 px-3 py-2 text-sm outline-none focus:border-accent"
            />
            <button type="submit" disabled={busy} className="btn-3d btn-accent px-4 py-2 text-sm">
              Sign in
            </button>
          </div>
          <button type="button" onClick={() => setMethod("link")} className="text-sm font-extrabold text-accent">
            First time, or no password yet? Email me a link
          </button>
        </form>
      ) : !sentTo ? (
        <form onSubmit={send} className="space-y-2">
          <div className="flex gap-2">
            <label htmlFor="sync-email" className="sr-only">
              Email
            </label>
            <input
              id="sync-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="min-w-0 flex-1 rounded-xl border-2 border-line bg-elev-2 px-3 py-2 text-sm outline-none focus:border-accent"
            />
            <button type="submit" disabled={busy} className="btn-3d btn-accent px-4 py-2 text-sm">
              Send link
            </button>
          </div>
          <button type="button" onClick={() => setMethod("password")} className="text-sm font-extrabold text-accent">
            Sign in with a password instead
          </button>
        </form>
      ) : (
        <form onSubmit={verify} className="space-y-2">
          <p role="status" className="text-sm font-bold text-good">
            Check {sentTo}. Open the link on this device, or type the code from the email here.
          </p>
          <div className="flex gap-2">
            <label htmlFor="sync-code" className="sr-only">
              Code from the email
            </label>
            <input
              id="sync-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              className="min-w-0 flex-1 rounded-xl border-2 border-line bg-elev-2 px-3 py-2 text-sm tracking-widest outline-none focus:border-accent"
            />
            <button
              type="submit"
              disabled={busy || code.trim().length < 6}
              className="btn-3d btn-accent px-4 py-2 text-sm"
            >
              Sign in
            </button>
          </div>
          <button type="button" onClick={() => setSentTo(null)} className="text-sm font-extrabold text-accent">
            Use a different email
          </button>
          <button
            type="button"
            onClick={() => {
              setSentTo(null);
              setMethod("password");
            }}
            className="block text-sm font-extrabold text-accent"
          >
            Sign in with a password instead
          </button>
        </form>
      )}
      {error && (
        <p role="alert" className="text-sm font-bold text-bad">
          {error}
        </p>
      )}
    </div>
  );
}
