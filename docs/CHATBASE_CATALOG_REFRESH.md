# Chatbase catalog refresh, November 6, 2026

The hosted Gym AI Coach (`leN3dAU7gJn3-rufdfJO_`) now has the source documents for the 225-exercise catalog deployed at https://gym.mdragonsolutions.com. This completes the hosted-source follow-up to [the photo expansion](PHOTO_EXPANSION_RELEASE.md), whose application commit is `69b35514bcafb37b27e1775b44a34843ef810675`.

## Source update

Uploaded the English and Spanish `01`, `02`, `05`, `06` and `08` guide files, plus `README.txt`, from `docs/chatbot` at that commit. Chatbase creates separate sources for same-named uploads. After verifying all 11 replacements were listed, exported the selected old sources as a ZIP of extracted text and removed those 11 older copies with the owner's explicit approval. The export is extracted source text, not an archive of the original uploads.

The final source inventory contains 17 files and the existing `AI Parameter Control - Training Supplement` text snippet. The `03`, `04` and `07` files and that snippet were preserved. Both Data Sources and the chat-widget playground showed a recent sync; the playground showed **Synced**, **524 KB**, **17 files** and **1 text snippet**. This dashboard synced uploads and deletions automatically; there was no separate retrain action used. Publish remained disabled, indicating no pending playground configuration change.

No model, instructions, billing, domain restrictions or saved workouts were changed. The dashboard continued to display GPT-6 Luna. This refresh did not independently audit the existing supplemental snippet or settings.

## Verification

- The hosted preview answered a catalog question with 225 exercises, 196 visual demos and two static reference photos for Kettlebell Renegade Row.
- An English Wednesday-only request returned one GYMPLAN block containing Kettlebell Renegade Row and Band-Assisted Pull-Up, both `3x10`, with the import-review instruction.
- A Spanish follow-up requesting Monday only returned one replacement block containing Flexión en anillas and Pase de pecho con balón medicinal en pareja, both `3x10`, plus a short technique note and the import-review instruction. Wednesday was absent from the revised draft.
- The visible blocks were transcribed into a local check against `parsePlanText`. Both parsed without errors or warnings. The English block resolved only Wednesday and IDs 278/285; the Spanish block resolved only Monday and IDs 288/279. No plan was applied to an account.
- `node scripts/verify-photo-release.mjs` passed against the production domain again, checking the 12 catalog additions and all 24 original JPEG checksums.

The coach checks used Chatbase's hosted chat-widget preview. They demonstrate the refreshed sources and these sampled responses, not a guarantee of every future model response. The production page's embedded chat and automatic Import button were not retested in this follow-up; their earlier integration verification is recorded in [the security and Chatbase release](SECURITY_CHATBASE_RELEASE.md).

## Remaining media work

The 11 held photo pairs, rejected push-up-to-side-plank pair and reference-only boxing/soccer coaching links remain outside the application. A further review of the licensed Commons boxing clip found general shadowboxing rather than a clear isolated drill sequence. Its checksum and review method are recorded in [the research manifest](research/exercise-expansion/manifest.json). No new media was published in this follow-up.
