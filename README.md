# Speakwise

A personal AI English speaking coach, built for a Hebrew speaker who understands English well
but wants to speak it fluently. Voice conversations with a tutor that remembers your mistakes,
gentle in-flow corrections, a report after every session, and spaced review.

- Product plan: [`docs/PLAN.md`](docs/PLAN.md)
- Market and tech research: [`docs/research/`](docs/research)
- Setup guide (Hebrew): [`docs/SETUP.md`](docs/SETUP.md)

## Stack

Next.js (App Router, TypeScript strict), Tailwind CSS, PWA · Azure Speech (STT, TTS,
pronunciation assessment) · OpenRouter (DeepSeek V3.2 by default) · Supabase (Postgres, auth,
RLS) · Vercel.

Providers sit behind interfaces in `lib/providers/*`, so swapping a vendor is a config change.

## Develop

```bash
cp .env.example .env.local   # fill in what you have; everything is optional locally
npm install
npm run dev
```

## Checks

```bash
npm run lint
npm run typecheck
npm test            # unit tests (Vitest)
npm run test:e2e    # end-to-end (Playwright, builds and starts the app)
```

CI runs all of the above on every pull request.
