# Wish list

Ideas agreed on but not started. Ordered by the owner's priority. Each entry
says what the user should experience, what already exists to build on, and
the open decisions, so a future session can start without re-deriving it.

## 1. AI exercise finder that fills the day

**Status (2026-09-21): superseded.** The paste-import shipped instead: the
AI coach ends every plan answer with a GYMPLAN v1 block (see
`docs/chatbot/08-plan-format-en.txt`), and **Import plan** under the days
builds the week from it, matching names to the library and creating custom
exercises for the rest. Zero backend, zero API cost. The in-app "Find
exercises" call described below is only worth revisiting if the copy and
paste step turns out to be a real barrier for users.


**What the user does.** On a day, taps "Find exercises" and types a request
in plain words, in English or Spanish: "3 chest exercises with dumbbells",
"something for lower back without equipment", "a 20 minute cardio finisher".
The app shows the picks with their demo button and default sets/reps. One
tap adds all of them to that day, in order; the user can untick any before
adding.

**Rules.**
- Picks come only from the app's own library (`src/constants/index.js`), so
  every added exercise has an id, a Spanish name, a demo where one exists,
  and equipment data. The AI chooses among library entries; it never invents
  names.
- Equipment and muscle group in the request are hard filters
  (`src/data/exerciseEquipment.js` and `muscleGroup`); count is honored;
  the rest of the request (goal, time, level) orders the candidates.
- Added exercises use the picker's default sets/reps rules
  (`ExerciseService.createExercise`), so they look like any other added
  exercise and the Log set, last week and demo features work unchanged.
- Works on the viewed editable week (current or planned ahead) and in the
  trainer panel for a client.

**What exists to build on.**
- The chatbot (Chatbase agent in `index.html`) already knows the library
  from `docs/chatbot/02-*`, but it cannot write into the app. This feature
  needs an in-app call instead.
- The Add Exercise picker already filters by muscle group, equipment and
  name in both languages; the finder is that filter with a language model
  choosing and ordering the subset.
- `AddExerciseModal.handleAdd` and `useWorkoutPlan.addExercise` are the
  insertion path; a batch variant (`addExercises(day, items)`) is the only
  new plumbing on the plan side.

**Open decisions.**
- Model call: a Supabase Edge Function that holds the API key and receives
  the request plus the compact library (id, name, group, equipment), and
  returns ids with a one-line reason each. Keeps the key off the client and
  lets the function enforce "ids from the library only".
- Offline or no-key fallback: run the same request through the local
  filters (muscle group and equipment keywords, count) so the button still
  works without the model, with a note that the pick was rule-based.
- Rate and cost: cache identical requests per session; cap at a handful of
  calls per minute per user in the function.
- UI placement: inside the Add Exercise picker as a third tab ("Ask"), so
  the demo preview and equipment chips are reused, rather than a new modal.

**Done when.** A user in Spanish can type "3 ejercicios de pecho con
mancuernas", see three dumbbell chest exercises from the library with demos,
tap once, and find them on the selected day with default sets and reps, saved
through the normal autosave. The trainer panel can do the same for a client.

## 2. Modern, accessible color system (and dark mode from it)

**Status (2026-09-21): shipped.** Tokens in `src/theme/tokens.css`, `npm run check:contrast`, theme switch, picker chips on families (#22, #29), axe pass with zero WCAG AA violations in both themes (#30). Not done from the spec: `prefers-contrast: more` only flattens the header; the muscle-group day headers use one color per state, not per family.

**What the user sees.** A calmer, current look: one brand accent, a neutral
scale for surfaces and text, and semantic colors for done, skipped, warning
and danger. Less gradient, more whitespace, the same layout. Every text and
control passes WCAG 2.2 AA in both light and dark, and dark mode follows
the phone setting with a manual override next to the unit toggle.

**Rules.**
- Contrast: 4.5:1 for text, 3:1 for icons, borders of inputs, focus rings
  and the progress bar fill. Check the exact pairs, not by eye: a
  contrast checker such as the WebAIM tool for the token table, and
  axe DevTools on the rendered app.
- Status is never color alone: completed, skipped and incomplete keep an
  icon and a label, and the day header keeps its text state. Pick a
  done/skipped pair that survives red-green color blindness (teal and
  amber, not green and red).
- Focus ring visible on every interactive element on every background,
  including the blinking rest alert and the dark toast.
- Touch targets stay at least 44 by 44 px (the stepper buttons and the
  small "Show" links in the hidden-days strip need a check).
- No new emojis as icons; where a glyph is needed use the lucide set already
  installed, so it inherits the token color.
- Respect `prefers-reduced-motion` and `prefers-contrast: more` (drop the
  gradients entirely, thicken borders).

**Proposed tokens** (starting point, to be verified with a contrast tool):
- Brand: teal `#0e7490` on light, `#22d3ee` on dark, for primary buttons,
  links and the Today pill.
- Surfaces: white / `#f8fafc` cards on light; `#0f172a` / `#1e293b` on dark.
- Text: `#0f172a` primary and `#475569` secondary on light; `#f1f5f9` and
  `#cbd5e1` on dark.
- Done `#0f766e`, skipped `#b45309`, danger `#b91c1c`, on tinted surfaces
  `#ccfbf1`, `#fef3c7`, `#fee2e2` (light) with dark counterparts.
- Muscle-group colors on day headers: reduce to two or three accents keyed
  to push / pull / legs / rest rather than one per group.

**How to get there in this codebase.** Components are styled inline with
literal hex values (about 60 distinct colors in `src/`). Plan:
1. Add `src/theme/tokens.css` defining the variables on `:root`, redefined
   under `prefers-color-scheme: dark` and under `[data-theme="dark"]`;
   `body` gets an explicit background.
2. Add a `ThemeContext` like `UnitsContext` storing light / dark / system.
3. Migrate component by component, replacing literals with `var(--...)`
   inside the existing inline style objects; no CSS framework needed. Start
   with the shared pieces: `Button`, `Modal`, `SaveStatusBar`, `UndoToast`,
   `StepperInput`, then `DayAccordion` and `ExerciseItem`, then the rest.
4. Run axe DevTools plus a manual pass (focus rings, 24px targets, zoom
   to 200%) on the tracker and the trainer panel in both themes before
   shipping; fix every contrast and target finding.
5. Update the PWA `theme_color` and the screenshots in the README.

**Done when.** Light and dark both pass axe with no contrast violations, the
manual toggle persists, the day cards and exercise rows read the same at a
glance, and the muscle-group and status colors are distinguishable with a
color-blindness simulator.

## 3. Week-over-week progress

**Status (2026-09-21): shipped** as the Progress tab in Weekly Summary (#31): weekly volume chart and table, per-exercise sparkline, best and last weight, change, CSV. Volume is done sets x lower reps x weight. Next steps if wanted: per-muscle-group volume, personal records, range picker.

Volume and top weight per exercise across stored weeks, from data already in
the history object. Chart per exercise and a weekly volume total; export
stays CSV. This is the roadmap's "analytics" item.

## 4. Backup, restore, and account deletion

**Status (2026-09-25): shipped.** Backup and restore (#41, landed on main by #42): Profile menu → Back up my data (JSON download of the whole history) and Restore from backup (summary, two-step confirm, Undo). Account deletion (#44): Profile menu → Delete my account through the delete-account Edge Function; every user table cascades from auth.users, admins are refused so the last admin cannot vanish.

JSON export and import of the whole history from the profile menu, plus a
delete-account action that removes the auth user, the plan row, the profile
row and trainer links. The last one also matters for store listings.

## 5. More templates

A 5-day split and a kettlebell week, once the library has enough kettlebell
movements with demos (`npm run report:coverage` shows the pool).

## 6. Conflict check on trainer saves

**Status (2026-09-21): shipped** (#28).

**What goes wrong.** `AdminService.saveWorkoutPlan` upserts a client's plan
without `expectedUpdatedAt`, so a trainer's "Save changes" is last-write-wins
over anything the client changed since the trainer opened the panel. The
tracker itself already sends the expected `updated_at` and shows the conflict
bar (`useWorkoutPlan.save`); the trainer panel should do the same. Import plan
makes trainer saves bigger, so the window matters more now.

**Plan.** Keep the loaded `updated_at` in AdminDashboard state, pass it to
`adminService.saveWorkoutPlan`, add the `.eq('updated_at', ...)` guard the
tracker uses in `SupabaseStorageService.saveWorkoutPlan`, and on a conflict
offer Reload or Overwrite like the tracker's SaveStatusBar.

## 7. Inactive free accounts

**Status (2026-09-25): tracking shipped (#44), enforcement waits for paid tiers.**

Decided 2026-09-25: track first, enforce later.
- Shipped: profiles.last_active_at, stamped by touch_last_active() when the app opens (at most every 12 h), backfilled from last sign-in and last plan save. The admin dashboard shows each account's last use and filters "Inactive 60+ days".
- When paid tiers exist: free accounts get an email at 60 days and 83 days (Brevo, with a reminder to back up), and are deleted at 90 days unless the app is opened. Paid accounts are exempt; the clock starts at the downgrade. Run a daily job in report-only mode for a few weeks before it deletes anything, and put the rule in the terms and privacy policy first.
- Open decisions: whether trainers with active clients are exempt; the tier model itself (free and paid for users and for trainers).

## Future ideas (not agreed yet)

Added 2026-09-25 as candidates for later sessions. None is started or
committed to; the owner picks and orders them before any work. The aim is
what makes the app different: bilingual EN/ES, a coach whose plans import in
one tap, and trainers with several clients. Suggested order: 8, then 9; 10
is the most distinctive but the biggest.

## 8. "Machine taken" swap

On the gym floor the planned machine is busy. One tap on the exercise offers
two or three alternatives for the same muscle group with different
equipment, and swaps it in place (sets, reps and weight carry over; Undo
works as usual).

Builds on: `src/data/exerciseEquipment.js` (id to equipment, already used by
the Add Exercise filter), the library's muscle group per exercise, and the
session Undo. No server work.

Open: whether the swap is for this session only or changes the plan; how to
rank alternatives when a family has many.

## 9. Voice logging, in English and Spanish

Say "3 sets of 10 at 60 kilos" or "tres series de diez con sesenta" and the
set is logged on the open exercise. Uses the browser's speech recognition
(`SpeechRecognition` / `webkitSpeechRecognition`) with the app language, so
no server cost.

Builds on: Log set, the steppers, `weightUnits.js` for kg/lbs, `textFold.js`
for accent-free matching. Support varies by browser (Safari and Chrome yes,
Firefox no), so the mic button only shows where the API exists.

Open: confirm before saving or save with Undo; whether to also accept
exercise names ("bench press, 3 by 10").

## 10. Coach that reads your progress

The coach sees the last few weeks from the Progress tab and suggests next
week's weights and reps; the answer ends in a GYMPLAN block, so the Import
bar applies it like any other plan.

Builds on: the Progress tab data, `useCoachPlan`, the GYMPLAN v1 import.
Needs a way to hand the data to Chatbase (the parked Chatbase Actions item,
or a summary the user sends on purpose), plus a privacy line saying what is
shared. Stays inside the no-medical-advice rule: load and volume only.

Open: automatic versus user-sent summary; how many weeks to send.

## 11. Gym-floor mode

One exercise at a time, big buttons, the rest timer built in, and the screen
kept awake (`navigator.wakeLock` where supported). Next and previous move
through the day.

Builds on: steppers, Log set, the background rest timer and its push
notification. Mostly a new layout over existing pieces.

Open: entry point (a button on the day, or automatic when the first set is
logged); what happens to hidden days and skipped exercises.

## 12. Readiness check-in

Before a session, rate sleep and soreness from 1 to 5. On low days the app
suggests trimming a set or keeping the weight, as a training suggestion
only, never health advice. Trainers see their clients' trend in the admin
dashboard.

Needs a small table with RLS (user reads and writes own rows, trainers read
their clients'), and EN/ES copy reviewed against the no-medical-advice rule.

Open: skippable by default; whether the suggestion changes the plan or only
shows a note.

## 13. Trainer feedback on sets

Trainers comment on a client's logged sets from the admin dashboard; the
client sees the note on the exercise. Later, short form-check videos from
the client for the trainer to review.

Comments need a table with RLS and fit the free tier. Video needs Supabase
storage, which costs money, so it waits for paid tiers (see item 7).

## 14. Share by WhatsApp

Share the week's plan or a personal-record card as an image, and send
trainer invites through WhatsApp. Aimed at Spanish-speaking gyms, where
WhatsApp is how people pass things around.

Builds on: `navigator.share` with a generated image (canvas), falling back
to a `wa.me` link with text. The invite flow already exists.

## 15. Personal records and streaks

Mark a new best weight or best volume on the exercise when it happens, and
show a weeks-trained streak. Listed in item 3 as a next step for the
Progress tab; expected rather than unique, but users notice when it is
missing, and it feeds the share card in item 14.
