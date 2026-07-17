# Chatbot knowledge base (Chatbase)

## Deployment record (last updated 2026-07-16)

- **Agent ID:** `RZAeW82nDUzmI2uMyEEL5` — embedded via the script in `index.html` (with custom bubble CSS in the same file)
- **Plan:** Hobby
- **Model:** GPT-5, temperature 0 · Instructions = system prompt below
- **Sources:** the 14 guide files in this folder uploaded as Files (no separate Q&A-pair entries yet — candidate follow-up: paste top pairs from the `05-` files into Sources → Q&A for verbatim answers)
- **Allowed domains:** `gymworkoutjm.vercel.app` + localhost (dev)
- **Knowledge-base size:** ~324K characters across 14 files
- **On content changes:** edit the doc here, re-upload that file in Sources, and hit **Retrain agent** — keep `06-roadmap-*` in sync with the main `README.md` roadmap

Training material for the in-app help chatbot. Upload the four guide files as **Sources** in Chatbase:

| File | Language | Content |
|---|---|---|
| `01-app-guide-en.md` | English | App overview, screen-by-screen navigation, accounts/sync, trainer & admin, default PPL plan, glossary, general recommendations, FAQ, chatbot behavior rules |
| `01-guia-app-es.md` | Spanish | Same content in Spanish |
| `02-exercise-guide-en.md` | English | All 159 exercises: muscles, equipment, technique steps, common mistakes, tips |
| `02-guia-ejercicios-es.md` | Spanish | Same content in Spanish |
| `03-training-setups-en.md` | English | Warm-up/cool-down routine, weekly setups for 3/4/5/6 days, home/bodyweight week, cardio & boxing add-ons, volume/progression rules, in-app setup steps |
| `03-planes-entrenamiento-es.md` | Spanish | Same content in Spanish |
| `04-health-tips-en.md` | English | General wellness tips (hydration, sleep, soreness vs pain, red flags, overtraining) — every section defers to medical supervision; includes redirect templates |
| `04-consejos-salud-es.md` | Spanish | Same content in Spanish |
| `05-qa-pairs-en.md` | English | ~40 canned Q&A pairs (exact question→answer) for the most common queries — can also be added as Chatbase Q&A source entries for consistent answers |
| `05-preguntas-respuestas-es.md` | Spanish | Same content in Spanish |
| `06-roadmap-en.md` | English | Feature status: what's available today, what's planned (no dates), what's not in the app, plus ready answers for "does the app have X?" |
| `06-roadmap-es.md` | Spanish | Same content in Spanish |
| `07-nutrition-basics-en.md` | English | General eating habits: balanced plate, protein (general published ranges only), carbs, fats, vegetables/fruit, hydration, eating around workouts — no personalized plans, always refers to dietitian/doctor |
| `07-nutricion-basica-es.md` | Spanish | Same content in Spanish |

Keep `EXERCISES.md` (repo root) as the source of truth for the exercise list — regenerate the guides if exercises are added or renamed.

## Suggested Chatbase system prompt

> You are the friendly in-app assistant for **Gym Tracker** (gymworkoutjm.vercel.app), a bilingual workout tracking app. Answer ONLY from the provided documents. Always reply in the user's language (English or Spanish). Help users navigate the app, use its features, learn general exercise technique, common mistakes, and training tips from the exercise guide, and share general healthy-eating and wellness basics from the nutrition and health-tips guides.
>
> Strict rules:
> - You are NOT a medical professional. Never diagnose pain or injuries, prescribe treatment or rehab, or advise on medical conditions, pregnancy, or medication. You may share general healthy-eating basics from the nutrition guide, but never personalized diet plans, calorie/macro prescriptions, or supplement recommendations. If the user mentions pain, injury, or a health condition, empathetically recommend stopping and consulting a doctor or certified professional.
> - For bug reports or feature requests, direct users to the "Share Your Feedback" button at the bottom of the main screen.
> - If something is outside the app or general exercise technique, say it is beyond what you can help with.
> - Keep answers short, friendly, and step-by-step when explaining app flows.

## Notes

- Exercise search inside the app matches **English** names only; both guides state this.
- 122 of 159 exercises have ▶ visual demos; Cardio, Combat, and custom exercises do not.
- Strength = sets/reps/weight (lbs). Cardio & Combat = minutes (1–120).
