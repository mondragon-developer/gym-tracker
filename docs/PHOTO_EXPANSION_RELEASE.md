# Photo expansion release, November 6, 2026

The library grows from 213 to 225 exercises, with media coverage growing from 184 to 196. IDs 278-289 add specific kettlebell, dumbbell, band, ring and bodyweight variations from the 12 preferred pairs in the research package. Existing exercise IDs and saved workouts are preserved.

Each addition includes English and Spanish names, edited instructions, equipment filtering, muscle labels and two labeled static reference photos. The relevant additions also appear in Functional fitness. Exact names in either language resolve through the plan importer. Descriptions identify the actual pose rather than assuming the first image is the start of the movement. Instructions cover omitted setup, opposite sides and landings. The 24 original JPEGs total 1,548,441 bytes and load when the demo opens. Instructions remain available if media fails.

The files ship with the application, using the same app-hosted approach as the existing functional GIFs. No database migration, storage permission change, API subscription or user-data mutation is required. The source revision, license declaration, dimensions, byte counts and SHA-256 checksums are recorded in `public/exercise-media/photos/provenance.json`. See [third-party notices](../THIRD_PARTY_NOTICES.md) and [research notes](research/exercise-expansion/README.md).

## Validation

- Full Vitest suite: 69 files, 504 tests passed.
- ESLint, production build and whitespace checks passed. The existing large JavaScript chunk warning remains.
- Catalog tests verify every new English/Spanish name resolves to its intended ID, bilingual details are present, the source pairs have preferred status, and packaged JPEGs match the pinned source hashes. Picker tests verify Spanish search with equipment filtering. Demo tests verify static presentation, Spanish descriptions and instruction fallback after image failure.
- Chrome component audit: 96 of 96 cases passed, covering all 12 photo dialogs in English and Spanish, light and dark themes, at 320px and 768px. No reported axe violations, incomplete checks or document-width overflow in this matrix. This is targeted browser coverage, not a claim of full application WCAG conformance.
- Browser control stopped after this completed matrix because it could not confidently determine the active Windows browser URL. No further browser interaction was attempted. Deployment and media verification use Vercel metadata and read-only HTTP checks.

## Rebuild and verify

Run `node scripts/enrichment/build-photo-expansion.mjs`, `node scripts/build-exercise-muscles.mjs` and `npm run build:plan-doc`. The photo builder checks all inputs before writing the batch; it uses local research images when present or fetches the exact pinned URLs otherwise. Run `node scripts/verify-photo-release.mjs` after deployment to check the live catalog bundle, provenance and all 24 photo checksums.

The Chatbase training documents were updated locally with this frontend release, including the exercise-name tables and bilingual instructions. A subsequent November 6 follow-up uploaded the 11 changed source files, removed their superseded copies with owner approval, and verified the hosted agent's synced catalog and bilingual GYMPLAN responses. See [the Chatbase refresh record](CHATBASE_CATALOG_REFRESH.md) for evidence and limits. Manual imports and app search use the new catalog immediately.

The 11 held pairs, the rejected push-up-to-side-plank pair and the 18 reference-only coaching links remain outside the app. A further boxing or soccer media batch needs suitable demonstrations; this release does not substitute generic conditioning for ball skills or specific boxing technique.
