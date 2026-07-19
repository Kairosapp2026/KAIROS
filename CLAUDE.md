# CLAUDE.md

Guidance for AI assistants working in the KAIROS codebase.

## What this is

KAIROS is a training-programming web app for CrossFit (`CF`) and HYROX (`HX`)
athletes. Its differentiator — and the actual product — is a **deterministic
adaptation engine**: the athlete says how much time they have today (1h or 2h)
and whether anything hurts, and the app rewrites that day's session in place,
substituting movements around the injury and adding targeted mobility at the
end. Tagline: *"La única programación que se adapta a tu día, no al revés."*

The entire UI and all content are in **Spanish**. Match that in any
user-facing string you add.

## Stack & commands

- **Vite 5 + React 18 + TypeScript** (strict mode), **Supabase** (auth + Postgres) as the backend.
- No test runner, no linter/formatter, no CI are configured. "Passing" means `npm run build` succeeds (it runs `tsc -b` first, so type errors fail the build).

```bash
npm install
npm run dev      # Vite dev server on http://localhost:5173
npm run build    # tsc -b && vite build  → dist/
npm run preview  # serve the production build
```

## Demo mode vs. connected mode

`src/lib/supabase.ts` reads `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.
If either is missing, `isDemo === true` and `supabase` is `null`.

- `.env.example` is the template; copy to `.env` (both are currently committed — see Gotchas).
- **Heads-up:** `App.tsx` currently *blocks* demo mode — when `isDemo` it renders "Faltan las variables de Supabase" instead of a working demo. The README still describes a full local demo (data lives in `src/data/mockData.ts`). If you touch startup/auth, decide deliberately whether to honor the README's demo promise or the current gate; don't assume they agree.

## Architecture

```
src/core/       Adaptation engine — pure, deterministic, NO React. This is the product.
src/data/       mockData.ts: one demo week per track + the substitution RULES table.
src/features/   Screens, grouped by feature (auth, today, coach, landing, onboarding).
src/lib/        supabase.ts client + demo-mode flag.
supabase/       migration.sql (⚠ out of date — see Gotchas).
```

### The engine (`src/core/`) — read this first

- **`types.ts`** — the data model. A `Day` has `blocks`; a `Block` has `lines`; a
  `Line` has `content` (text keyed by level, with `'*'` as the fallback for all
  levels) and `patterns` (movement tags like `squat`, `push_vertical`, `hinge`).
- **`adaptation.ts`** — `adaptSession(blocks, duration, pains, rules, level)` is the
  whole engine. It is pure and deterministic (no I/O, no dates, no randomness).
  For each line it picks the level-specific text, then for each declared pain it
  finds a `Rule` matching `(pattern, zone, severity)` and swaps the text for the
  substitute. `duration === '1h'` hides every non-`NUCLEO` block (`visible`
  flag). WODs (formats in `WOD_FORMATS`) prefer `rule.substituteWod` when present.
- **`mobility.ts`** — `MOBILITY` drills per body zone, plus the `ZONES` and
  `PAIN_TYPES` option lists the UI renders.
- Keep this layer free of React/Supabase imports. Test-ability and predictability
  come from its purity — preserve that.

### The domain model in three sentences

Pain has a **zone** (hombro, muñeca, lumbar, rodilla, cadera, tobillo) and a
**type**: `calentar` (only when warming up → no substitution, just an activation
warning + final mobility), `final` (end of range), or `carga` (under load). A
**Rule** maps `pattern + zone + severity(final|carga)` to a substitute movement.
The coach never writes rules per exercise — lines carry `patterns`, and the
engine matches them against the shared `RULES` table in `mockData.ts`.

### Auto-tagging (coach side)

`src/features/coach/CoachPanel.tsx` holds `AUTO_TAGS`: an ordered list of
`[RegExp, patterns[]]`. When a coach edits a line's text, `autoPatterns()`
assigns movement patterns from the **first** matching regex (order matters —
more specific movements are listed before general ones). Coaches can override
with a manual `:: pattern,pattern` suffix on a line. If you add exercises or
patterns, update `AUTO_TAGS` **and** the `RULES` table together, or the movement
won't adapt.

### Features

- **`auth/AuthApp.tsx`** — the real app entry after `App.tsx`. Handles Supabase
  session, landing/sign-in/sign-up/legal gating, password recovery, profile
  loading, track choice, level, the Stripe paywall/trial logic (`accessInfo`),
  and the coach-vs-athlete view switch. `PAY_URL`/`PORTAL_URL` are **Stripe test**
  links.
- **`today/`** — the main athlete flow. `TodaySession.tsx` is the step machine
  (`week → level → duration → pain → session`); `useTodaySession.ts` is the hook
  that loads the published week (falling back to `mockData`), runs `adaptSession`,
  and persists check-ins, per-block logs, and day status to Supabase.
- **`coach/CoachPanel.tsx`** — roster, per-athlete activity, and an 8-week
  planner/editor (visual + JSON "Código IA" mode) that publishes weeks to the
  `published_weeks` table. `validateWeek()` is the gatekeeper for imported JSON.
- **`landing/`** — marketing `Landing.tsx` and `Legal.tsx` (terms/privacy).
- **`onboarding/Onboarding.tsx`** — **currently unused / dead code** (not imported
  anywhere; superseded by `AuthApp`). Don't wire new work through it without
  confirming intent.

## Conventions

- **Language:** Spanish for all UI text and commit messages (e.g. `ciclo-por-semana`,
  `textos-legales`). Existing code strings mostly omit accents/tildes even in
  Spanish (`programacion`, `sesion`); follow the surrounding file.
- **Styling:** one global `src/styles.css` (~400 lines) with plain class names;
  no CSS modules, no Tailwind. Some inline `style={{}}` for one-offs. Reuse
  existing classes (`screen`, `option`, `chip`, `cta`, `block`, `eyebrow`, `muted`, `note`).
- **State:** React hooks only — no Redux/Zustand/router. "Routing" is local
  `useState` gates inside `AuthApp` and `TodaySession`.
- **Supabase calls:** the client is nullable. In connected components the code
  asserts `supabase!`; in shared hooks it guards `if (!sb) return;`. Match the
  pattern of the file you're in.
- **IDs:** blocks/lines carry string `id`s used as React keys and as the join key
  for logs (`session_logs.block_id`). Keep them stable — changing a block `id`
  orphans athletes' logged marks.

## Supabase schema — GOTCHA

`supabase/migration.sql` is **stale and does not match the code.** The app reads
and writes tables that the migration never creates, and some columns differ:

- Code uses **`published_weeks`** (columns `track`, `week_start`, `data` jsonb,
  `cycle` jsonb, `updated_at`) — **absent** from the migration.
- Code uses **`day_status`** (`user_id`, `track`, `dow`, `status`) — **absent**.
- Code reads `checkins` with columns `track`, `dow` — the migration defines
  `checkins` with `day_id` instead.
- Code reads `profiles.role`, `profiles.pending_track`, etc. — partially present.

If you change data access, treat the running Supabase project (not this SQL
file) as the source of truth, and update `migration.sql` to reflect reality.
Do not assume the migration is runnable as-is.

## Repo hygiene notes (don't replicate these)

- There is **no `.gitignore`**, and `node_modules/`, `dist/`, and `.env` are all
  committed. Avoid adding to the tracked `node_modules`/`dist`; don't put real
  secrets in `.env` while it's tracked.
- Stray/legacy files at the root: `CoachPanel-editor.txt` (an older copy of the
  coach panel) and `estilos-v4.txt` (empty). Not part of the build; ignore them.

## Working agreement

- Prefer changes in `src/core/` + `src/data/` when the task is about *how sessions
  adapt* — that's where the product logic lives, and it's UI-agnostic.
- Keep the engine pure; keep Supabase and React out of `src/core/`.
- When adding a movement or adaptation, update `AUTO_TAGS` (coach), the line
  `patterns`, and the `RULES` table consistently.
- Run `npm run build` before considering a change done — it's the only automated
  check available.
