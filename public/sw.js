// Speakwise service worker. It makes the app installable and lets the parts that need no
// server (quick review, the phrase bank, progress, the guide) open without a connection:
// the learner's data already lives on the device. It never caches API responses or audio.
const SHELL = "sw-shell-v6";
const STATIC = "sw-static-v1";
const OFFLINE_URL = "/offline.html";
// Pages kept for offline use: the last copy that loaded fine is served when the network fails.
const OFFLINE_PAGES = ["/", "/review", "/words", "/read", "/phrases", "/progress", "/practice", "/guide", "/pronounce", "/say"];
// Detail pages (one drill set, one short read) are kept once he has opened them, so the
// lists above don't link to pages that can't load offline.
const VISITED_PREFIXES = ["/say/", "/read/"];
const STATIC_MAX = 150;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL).then((c) => c.addAll([OFFLINE_URL, "/icon.svg", "/manifest.webmanifest"])));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== SHELL && k !== STATIC).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

// Build files the kept offline pages load: never trimmed, or those pages couldn't start offline.
// Read the saved pages once per burst of downloads, not once per file.
let usedMemo = null;
function filesInUse() {
  if (!usedMemo) {
    usedMemo = readFilesInUse();
    setTimeout(() => (usedMemo = null), 30000);
  }
  return usedMemo;
}

async function readFilesInUse() {
  const shell = await caches.open(SHELL);
  const used = new Set();
  for (const key of await shell.keys()) {
    const res = await shell.match(key);
    if (!res) continue;
    // Paths can sit inside escaped JSON (a trailing backslash) or carry a query string.
    for (const m of (await res.text()).matchAll(/\/_next\/static\/[^"'\s)\\?#]+/g)) used.add(m[0]);
  }
  return used;
}

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= max) return;
  const used = await filesInUse();
  const spare = keys.filter((k) => !used.has(new URL(k.url).pathname));
  await Promise.all(spare.slice(0, keys.length - max).map((k) => cache.delete(k)));
}

// Build files have a hash in their name, so a cached copy is always the right one.
async function staticFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const res = await fetch(request);
  if (res.ok) {
    const copy = res.clone();
    caches
      .open(STATIC)
      .then((c) => c.put(request, copy))
      .then(() => trim(STATIC, STATIC_MAX));
  }
  return res;
}

async function page(request) {
  const url = new URL(request.url);
  const keep = OFFLINE_PAGES.includes(url.pathname) || VISITED_PREFIXES.some((p) => url.pathname.startsWith(p));
  try {
    const res = await fetch(request);
    // A redirect (to unlock or setup) or an error page is not worth keeping.
    if (keep && res.ok && !res.redirected) {
      const copy = res.clone();
      caches.open(SHELL).then((c) => c.put(url.pathname, copy));
    }
    return res;
  } catch {
    return (keep && (await caches.match(url.pathname))) || (await caches.match(OFFLINE_URL));
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(staticFirst(request));
  } else if (request.mode === "navigate") {
    event.respondWith(page(request));
  }
});
