# Wish list

Ideas agreed on but not started. Ordered by the owner's priority. Each entry
says what the user should experience, what already exists to build on, and
the open decisions, so a future session can start without re-deriving it.

## 1. AI exercise finder that fills the day

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

## 2. Week-over-week progress

Volume and top weight per exercise across stored weeks, from data already in
the history object. Chart per exercise and a weekly volume total; export
stays CSV. This is the roadmap's "analytics" item.

## 3. Dark mode

Components style inline, so this needs color tokens first, then a theme
toggle stored like the unit preference. Mechanical but wide.

## 4. Backup, restore, and account deletion

JSON export and import of the whole history from the profile menu, plus a
delete-account action that removes the auth user, the plan row, the profile
row and trainer links. The last one also matters for store listings.

## 5. More templates

A 5-day split and a kettlebell week, once the library has enough kettlebell
movements with demos (`npm run report:coverage` shows the pool).
