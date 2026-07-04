# Gym Tracker — Continuation Prompt for Claude Code

Copy everything below the line into Claude Code as your first message. It contains full context: what exists, what's done, what's missing, the branch problem, and the plan.

---

## Context

I'm building a **Gym Tracker** — a React 19 + TypeScript + Vite + Tailwind SPA with a **Supabase (Postgres)** backend. The repo root is the app itself (`gym-tracker-react/`), remote `origin` = `https://github.com/mondragon-developer/gym-app.git`, and it's deployed on **Vercel** (production: https://gymworkoutjm.vercel.app).

Architecture follows **SOLID** with a clean **repository → service → context** layering. Please keep that style: program to interfaces, keep single responsibilities, and prefer small, composable modules. Code comments should explain *why*, not *what*.

## What was just built (currently UNCOMMITTED on `main`)

A previous session added a full Supabase backend + auth + admin onto the `main` working tree. It typechecks (`tsc -b` exit 0) and builds (`vite build` exit 0). Files:

**Data layer (async, interface-driven):**
- `src/lib/supabaseClient.ts` — single shared Supabase client, reads `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` from `.env` (git-ignored; see `.env.example`).
- `src/lib/currentUser.ts` — `requireUserId()` helper.
- `src/repositories/interfaces/` — `IExerciseRepository`, `IProgressRepository`, `IDayNotesRepository`. **All methods now return Promises** (were synchronous before).
- `src/repositories/SupabaseExerciseRepository.ts`, `SupabaseProgressRepository.ts`, `SupabaseDayNotesRepository.ts` — Supabase implementations.
- `src/repositories/LocalStorage*Repository.ts` — updated to async to stay valid as an offline fallback.
- `src/services/ExerciseService.ts`, `ProgressService.ts` — now async.
- `src/contexts/GymContext.tsx` — wired to the Supabase repos; loads data async; remounts per user via `key={user.id}` in App.

**Auth:**
- `src/contexts/AuthContext.tsx` — session state + `signIn/signUp/signOut` + `isAdmin` (looked up from `profiles.role`).
- `src/components/AuthScreen.tsx` — email/password login+signup (functional but PLAIN styling).
- `src/App.tsx` — gates on auth: loading → AuthScreen → app; admins get an "Admin panel" toggle.

**Admin (full view + edit):**
- `src/types/Admin.ts`, `src/services/AdminService.ts` — cross-user list/role/view/edit.
- `src/components/AdminDashboard.tsx` — user list, role management, edit any user's exercises/progress/notes.

**Database SQL (must be run in Supabase SQL editor):**
- `supabase/schema.sql` — `exercises`, `progress`, `day_notes` tables, each scoped to `user_id` with Row Level Security.
- `supabase/admin.sql` — `profiles` table + signup trigger + `is_admin()` (SECURITY DEFINER, avoids RLS recursion) + admin full-access policies.

**Also fixed:** Tailwind was v4 installed but all code is v3-style, so ZERO utility classes were generated (no colors). Downgraded to `tailwindcss@^3.4`, updated `postcss.config.js` to the v3 plugin form. **After pulling, restart the dev server** so PostCSS reloads.

## The BIG problem to resolve first: branch divergence

The `main` branch I built on is the **basic** UI (day accordions only — no header, no dragon logo, no Eng/Esp language toggle, and `ProgressBar.tsx` exists but isn't wired in).

But **production** (gymworkoutjm.vercel.app) and a **preview branch** (`gym-tracker-git-claude-cre-0e50bf-…`) show a **much more polished design**: dragon logo, gradient header, language toggle, wired weekly progress bar, and a nicer "Welcome Back" login screen. **That code is NOT on `main`** — it lives on other branch(es). That preview branch also already has **its own auth implementation**, different from the one I built — so there are currently two auth systems.

**First tasks for you:**
1. `git fetch origin` and `git branch -a` to see all branches. Identify (a) which branch is deployed to production, and (b) which branch has the polished UI + existing auth.
2. Show me a summary/diff of the polished branch's UI and its auth so we can decide the source of truth.
3. Recommend a merge strategy. My backend is largely UI-independent and portable (lib/, Supabase*Repository, AdminService, AdminDashboard, the two .sql files, isAdmin logic). The files that clash with an existing auth are `App.tsx`, `AuthContext.tsx`, `AuthScreen.tsx`. Goal: ONE coherent version = polished UI + my Supabase backend + admin, deployed to production.

Do NOT lose the uncommitted work on `main`. Before switching branches, commit it to a feature branch:
```
git checkout -b feat/supabase-backend-admin
git add -A
git commit -m "Supabase backend, auth, admin dashboard, Tailwind v3 fix"
git push -u origin feat/supabase-backend-admin
```

## What's still MISSING / TODO

1. **Run the SQL**: execute `supabase/schema.sql` then `supabase/admin.sql` in the Supabase SQL editor. Then promote yourself: `update public.profiles set role='admin' where email='mondradev@gmail.com';`
2. **Vercel env vars**: add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (Production + Preview), then redeploy (Vite bakes env at build time).
3. **Supabase Auth URLs**: set Site URL = https://gymworkoutjm.vercel.app and add redirect `https://gymworkoutjm.vercel.app/**`. Decide email-confirmation on/off.
4. **Reconcile branches** (above) and merge polished UI + backend into `main`.
5. **Style the auth screen** to match the polished "Welcome Back" design (dragon logo, gradient) if we keep my AuthScreen.
6. **Rotate the Supabase anon key** — it was pasted into an earlier chat. If the repo is public, roll it in Supabase → Settings → API.
7. **Nice-to-have**: wire `ProgressBar` into the tracker if the chosen UI expects it; add a proper router (react-router) instead of the ad-hoc admin toggle; add loading/empty states; tests.

## Verification expectations

- `npx tsc -b` must exit 0 and `npx vite build` must succeed after any change.
- Note: on this machine, `vite build` may fail to delete `dist/` due to a permissions quirk — build to a temp dir to verify (`npx vite build --outDir /tmp/out`) or just delete `dist/` first.

## My preferences

Concise, direct explanations but thorough when explaining what changed. SOLID code. Explain steps for someone who doesn't assume prior knowledge, with examples. Pick the architecture that gives the simplest, cleanest result.
