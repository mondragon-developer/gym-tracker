# Gym Tracker — App Guide & Chatbot Knowledge Base (English)

## About the app

Gym Tracker is a free - for now -, bilingual (English/Spanish) web app for planning and tracking weekly workouts. It is available at **gymworkoutjm.vercel.app**, works on any phone, tablet, or computer, and can be installed on a phone's home screen like a native app (it is a Progressive Web App). It was built by Jose Mondragon.

Key capabilities:
- A pre-loaded **6-day Push/Pull/Legs split** you can fully customize.
- A library of **159 exercises across 11 categories** (Chest, Back, Shoulders, Biceps, Triceps, Forearms, Legs, Abs, Cardio, Combat), plus custom exercises you create yourself.
- **Strength exercises** track sets, reps, and weight (lbs). **Cardio and Combat exercises** are time-based and track minutes (1–120).
- **Visual exercise demonstrations**: 122 exercises have a start-to-finish demo you open with the ▶ button.
- **Weekly progress tracking** with a progress bar, weekly summary, and CSV export.
- **Works with or without an account**: without an account everything saves to the device (local storage); with a free account everything syncs to the cloud and follows you across devices.
- **Trainer support**: trainers get an invite code/link; clients who sign up with it are linked to the trainer, who can manage their weekly plans.

## Chatbot scope and behavior rules

The chatbot embedded in this app should:
1. **Help users navigate and use the app** (all flows described in this guide).
2. **Answer general exercise questions**: which exercises exist in the app, what muscles they work, proper technique, common mistakes, and general training recommendations (see the Exercise Guide document). General healthy-eating and wellness basics (see the Nutrition Basics and Health Tips documents) are also in scope — personalized diet plans and prescriptions are not.
3. **Never give medical advice.** Do not diagnose pain or injuries, prescribe treatment or rehabilitation, or give advice for medical conditions, pregnancy, medication, or supplements. If a user mentions pain, injury, dizziness, or a health condition, respond with empathy and recommend they stop the exercise and consult a doctor, physical therapist, or certified professional. You may still give generic safety cues like "use a weight you can control" or "keep your back neutral".
4. **Answer in the user's language** (English or Spanish).
5. If a user reports a bug or wants to suggest a feature, point them to the **"Share Your Feedback"** button at the bottom of the main screen.
6. If a question is outside the app and general fitness technique (nutrition plans, medical questions, other apps), politely say it is outside what you can help with.

## Screen-by-screen navigation guide

### Header (top of the screen)
- **Logo and title**: the Gym Tracker logo with the tagline "Track your weekly fitness progress".
- **Language toggle (EN/ES)**: switches the whole interface between English and Spanish instantly. Exercise names in lists and search stay in English; many exercises also display a Spanish name.
- **Profile menu**: shows the signed-in account and contains **Sign Out**. If not signed in, the app shows the sign-in screen first (see Accounts below).
- **🛡️ Admin / 🏋️ Trainer button**: visible only to admins and trainers; opens their management panel. Regular users never see it.

### Week navigator
Directly under the header:
- Shows **"Week of \<date\>"** — every week is stamped with its real calendar date range, and each day card shows its date.
- **Arrows** step to the **previous week / next week**. Past weeks open in **read-only mode** — the banner "Viewing a past week — read only" appears and nothing can be edited there. Use **"Back to current week"** to return to the editable current week.

### Weekly Progress bar
Shows "Weekly Progress" with **X of Y exercises completed** and a percentage that fills in real time as exercises are marked complete. At 100% it celebrates with "Week Complete!".

### Day cards (Monday–Sunday)
Each day of the week is a collapsible card (accordion) labeled with the day name, its date, and its muscle groups (for example "Chest & Shoulders & Triceps"). Tap a day to expand it and see its exercises.

Inside a day:
- **Add Exercise** — opens the exercise picker (see below).
- **Reset Day** — restores that single day to the default plan after a confirmation ("Are you sure you want to reset this day's exercises?").
- **✏️ Change muscle group** — lets you pick **up to 3 muscle groups** for that day from: Rest, Chest, Back, Shoulders, Biceps, Triceps, Forearms, Legs, Abs, Cardio, Combat. Choose "Rest" to make it a rest day. Press **Done** to confirm.
- If a day has no exercises it shows "No exercises for today — Add an exercise to get started!".

### Exercise rows
Each exercise inside a day shows:
- **Drag handle** — press and drag to reorder exercises within the day (works with touch).
- **▶ demo button** — opens **"How to do this exercise"**, a visual demonstration of the full range of motion, start to finish. 122 of the 159 built-in exercises have demos; Cardio, Combat, and custom exercises show "No demonstration available yet".
- **Strength exercises**: editable **Sets**, **Reps** (e.g. "8-10"), **Weight** (lbs), and **Effective** — the number of sets actually completed.
- **Cardio/Combat exercises**: editable **Duration** in minutes (1–120) and the minutes actually completed. No weight field.
- **✓ Mark as completed** — turns the row green and counts toward weekly progress. Tap again to set it back to incomplete.
- **✗ Mark as skipped** — marks the exercise as intentionally skipped (red). Tap again to undo.
- **Edit / Delete** — edit the exercise's numbers or remove it (delete asks for confirmation).

### Add Exercise modal
Opened with **"Add Exercise"** on any day:
1. **Search bar** ("Search exercises...") — type any exercise name for instant filtering with the matching text highlighted. Note: exercise names are searched in **English** (e.g. search "Squats", not "Sentadillas").
2. **Filter tabs** — **Popular** (a curated shortlist), **All**, or a specific muscle group.
3. **Defaults** — before adding, set **Target Sets (1–10)** and **Target Reps (1–20)**. Cardio/Combat exercises show a **Target Duration (1–120 minutes)** selector instead.
4. **Custom Exercise tab** — create your own exercise: enter a name, sets, and reps, then **Add to Workout**. Custom exercises have no demo image.

### Weekly Summary (📊 button)
The **📊 Weekly Summary** button below the days opens a report of the current week:
- Totals: **Total exercises, Completed, Total sets, Sets done, Cardio (min), Cardio done (min)**.
- **Sets per muscle group** — a per-muscle breakdown of planned vs done sets.
- **Week detail** — every exercise by day with its status (completed / incomplete / skipped).
- **Download CSV** — exports the summary as a CSV file for Excel/Sheets.

### 🔄 Start New Week
The **"Start New Week"** button archives the current week and starts a fresh one. A confirmation modal explains what happens. Important: the new week **keeps all your exercises and weights and only resets completion status** (carry-forward), so you can apply progressive overload without rebuilding your plan. The finished week remains viewable (read-only) through the week navigator.

### Share Your Feedback
At the bottom of the main screen. Opens a form with **Name, Email, Message** — sends feedback directly to the developer. Use this for bug reports and feature requests.

## Accounts, sync, and passwords

### Using the app without an account
Everything works without signing in: the plan saves automatically to the device's local storage. Limitations: data stays on that one device/browser and can be lost if the browser data is cleared. On your **first sign-in, local data migrates automatically to the cloud**.

### Creating an account (Sign Up)
1. On the sign-in screen choose **Sign Up**.
2. Enter your **name, email, and a password of at least 6 characters** (and confirm it).
3. Optional: enter a **Trainer code** if a personal trainer gave you one — this links your account to that trainer. Leave it empty if you train on your own. An invalid code shows "Invalid trainer code".
4. Check your email — the app sends a **confirmation link** you must click to verify the account ("Check Your Email" screen).

### Signing in and out
- **Sign In** with email and password. Once signed in, workouts sync to the cloud and follow you to any device.
- **Sign Out** is in the profile menu in the header.

### Forgot password
1. On the sign-in screen tap **"Forgot password?"**.
2. Enter your email and tap **Send Reset Link**.
3. Open the emailed link — it takes you to a **Set New Password** screen where you enter and confirm the new password (minimum 6 characters).

## Trainer features

- A **trainer** account is created through a single-use trainer invitation link (issued by an admin).
- Trainers have a **Trainer panel** (🏋️ button in the header) where they see their **Clients**, open any client's weekly plan, and build or adjust it (add/remove exercises, change sets/reps, reset to default, save changes).
- Trainers have a personal **invite code** and **invite link** with Copy buttons. Clients who sign up using the trainer's code or invite link are **assigned to that trainer automatically**. Existing solo users can also be linked by entering the code where applicable.

## Admin features (for completeness)

Admins see the 🛡️ **Admin panel**: list of all users, role management (make admin / demote, assign trainer), viewing/editing any user's workout plan, resetting a plan to default, deleting a user's cloud data, and creating single-use **trainer invitations**. Access is enforced server-side; regular users cannot reach it.

## The default workout plan (Push/Pull/Legs)

The app ships pre-loaded with this 6-day split. Sunday is a rest day. Users can change everything.

**Monday — Chest & Shoulders & Triceps (Push):**
Barbell Bench Press 4×8-10 · Incline Dumbbell Press 3×10-12 · Military Press 4×8-10 · Lateral Raises 3×12-15 · Rope Pushdowns 3×10-12

**Tuesday — Back & Biceps (Pull):**
Pull-ups 3×8-12 · Seated Cable Rows 4×10-12 · Barbell Curls 4×10-12 · Hammer Curls 3×12-15

**Wednesday — Legs:**
Barbell Squats 4×8-10 · Romanian Deadlifts 3×10-12 · Leg Press 3×12-15 · Single-Leg Calf Raises 4×15-20

**Thursday — Chest & Shoulders & Triceps (Push):**
Cable Flyes 3×12-15 · Dumbbell Press 4×8-12 · Push-Ups 3×12-15 · Overhead Press 3×8-10 · Lateral Raises 3×12-15 · Skull Crushers 3×10-12 · Dips 3×8-12

**Friday — Back & Biceps (Pull):**
Lat Pulldowns 4×10-12 · Bent-Over Barbell Rows 3×8-10 · Single-Arm Dumbbell Rows 3×10-12 · Face Pulls 3×15-20 · Dumbbell Curls 4×10-12 · Preacher Curls 3×12-15 · Hammer Curls 3×12-15

**Saturday — Legs:**
Deadlifts 4×6-8 · Front Squats 3×8-10 · Lunges 3×12-15 · Leg Extensions 3×15-20 · Lying Leg Curls 3×12-15 · Standing Calf Raises 4×15-20 · Seated Calf Raises 3×15-20

**Sunday — Rest.**

## Training concepts glossary (non-medical)

- **Set (Series)**: a group of consecutive repetitions. "4×8-10" means 4 sets of 8 to 10 reps.
- **Rep (repetition)**: one complete movement of an exercise.
- **Effective sets**: in this app, the sets you actually completed (vs the target).
- **Weight**: the load used, entered in lbs.
- **Push/Pull/Legs (PPL)**: a split that groups pushing muscles (chest, shoulders, triceps), pulling muscles (back, biceps), and legs on separate days, each trained twice per week here.
- **Progressive overload**: gradually increasing weight, reps, or sets over weeks. The app supports this by carrying your numbers into each new week.
- **Rest day**: a day without training so muscles can recover — Sunday by default.
- **Time-based exercise**: Cardio and Combat entries measured in minutes instead of sets/reps.

## General training recommendations (non-medical)

- **Warm up first**: 5–10 minutes of light cardio plus lighter warm-up sets of your first exercise.
- **Technique before load**: learn the movement with light weight; use the ▶ demo in the app as a visual reference.
- **Rest between sets**: commonly ~1–2 minutes for smaller/isolation exercises and ~2–3 minutes for heavy compound lifts.
- **Progress gradually**: when you hit the top of your rep range on all sets with good form, increase the weight slightly the next week.
- **Consistency beats intensity**: completing the week's plan regularly matters more than one extreme session. Use the progress bar and Weekly Summary to stay on track.
- **Listen to your body (generic)**: sharp pain, dizziness, or unusual discomfort means stop; if it persists, see a qualified professional. The chatbot cannot evaluate symptoms.

## FAQ / Troubleshooting

**Do I need an account?** No. Without one, data saves to your device. An account adds free cloud sync across devices.

**My workouts don't appear on my other device.** Cloud sync requires signing in with the same account on both devices. Data created while signed out lives only on that device until you sign in (then it migrates automatically).

**I can't edit my week.** You are probably viewing a past week — they are read-only. Tap "Back to current week".

**Will "Start New Week" delete my plan?** No. It keeps your exercises and weights and resets only the completion status. Past weeks stay viewable in the navigator. ("Reset Week"/"Reset Day" restore the *default* plan, so use those only when you want to discard customizations.)

**An exercise has no demo.** 122 of 159 exercises have demos. Cardio, Combat, and custom exercises don't — the app shows "No demonstration available yet".

**How do I change the language?** Tap the EN/ES toggle in the header. The whole interface switches instantly.

**How do I search in Spanish?** The search matches English exercise names. If the interface is in Spanish, still search by the English name (the guide documents list both names).

**How do I install the app on my phone?** In the mobile browser open the app and choose "Add to Home Screen" (iOS Safari: Share → Add to Home Screen; Android Chrome: menu → Install app / Add to Home screen). It then opens like a native app and works offline.

**I forgot my password.** Use "Forgot password?" on the sign-in screen to receive an email reset link.

**I didn't get the confirmation/reset email.** Check spam/junk. Make sure the email address is correct; you can retry from the same screen.

**How do I track weight in kg?** The weight field is labeled lbs, but it is a free number field — you can type your kg value consistently if you prefer; the app does not convert units.

**How do I report a bug or suggest a feature?** Use "Share Your Feedback" at the bottom of the main screen.

**Is my data private?** Yes. Cloud data is stored per-account and protected server-side (Row Level Security); only you — and your trainer or an admin, if applicable — can access your plan.
