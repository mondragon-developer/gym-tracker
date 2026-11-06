# Exercise media and data

## Reviewed photo expansion (IDs 278-289)

Twelve additional exercises use 24 original JPEGs from the same pinned free-exercise-db revision `f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5`, published under the [Unlicense](https://raw.githubusercontent.com/yuhonas/free-exercise-db/f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5/LICENSE.md). The files are copied without image modifications. The upstream declaration is recorded, without an independent guarantee of contributor ownership or model releases.

The license and per-image source URLs, dimensions, byte sizes and SHA-256 hashes ship in `public/exercise-media/photos/`. Only the preferred pairs in `docs/research/exercise-expansion/manifest.json` are included. Held and rejected candidates are excluded. English and Spanish instructions and photo descriptions are edited by Gym Tracker.

Both photos are displayed as labeled static references, with descriptions of their actual poses. They are not continuous footage. Instructions explain missing setup, alternating sides or landing phases. Media is served by the app and requested when its demo opens. Rebuild with `node scripts/enrichment/build-photo-expansion.mjs`, which checks every photo against the pinned research hashes before writing files, then `node scripts/build-exercise-muscles.mjs`.

## Functional fitness additions (IDs 246–277)

The 32 exercise records and photo pairs come from [yuhonas/free-exercise-db](https://github.com/yuhonas/free-exercise-db), pinned to commit `f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5`. The upstream project publishes its dataset under the **Unlicense**, permitting commercial and noncommercial reuse. This records the upstream license declaration; it is not an independent guarantee of every contributor's ownership or model releases.

- A copy of the upstream license ships at `public/exercise-media/functional/LICENSE.txt`.
- `public/exercise-media/functional/provenance.json` records source paths, revision, modifications, source-image SHA-256 hashes, and resulting GIF hashes.
- Each GIF alternates two licensed photographs, fitted to a white canvas. These are **two-position references**, not continuous footage or complete demonstrations of complex lifts. No intermediate poses were invented.
- English instructions retain the source wording. Spanish summaries and exercise-name translations are maintained by this project.
- Media ships with the app and loads only when a demo opens. There are no new API subscriptions, paid media licenses, or runtime third-party image requests.
- Upstream images may contain equipment or location branding; this app does not imply endorsement or affiliation.

Rebuild from the repository root with `node scripts/enrichment/build-functional.mjs` (Node with fetch and Python with Pillow 12.3.0). Review the source and contact sheet after changing the selection. The script fails on missing downloads or missing image pairs. Spanish summaries are maintained separately in `src/data/functionalInstructionsEs.js`.

The search term “CrossFit” finds relevant functional fitness exercises. CrossFit is a third-party trademark; the collection is labeled “Functional fitness” and is not an official CrossFit product.

## Existing assets

Existing two-photo demos use the same free-exercise-db source and remain self-hosted in Supabase Storage. Existing instruction enrichment uses the MIT-licensed [hasaneyldrm/exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset); this project does not import that dataset's externally linked Gym Visual GIFs.

## Sources evaluated but not imported

[Wikimedia Commons: Burpee.gif](https://commons.wikimedia.org/wiki/File:Burpee.gif) is available under CC BY-SA 4.0, credited to Taco Fleur (loop by Jahobr). It depicts the original squat-thrust variation, so it was not substituted for the existing generic Burpees entry. No assets from this file are included.
