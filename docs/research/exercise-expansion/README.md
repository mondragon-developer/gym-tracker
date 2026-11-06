# Exercise expansion research

Implementation update, November 6, 2026: the 12 preferred pairs are now integrated as catalog IDs 278-289 with English/Spanish names, edited instructions, descriptions and 24 app-hosted static JPEGs. The catalog contains 225 exercises, 196 with media. Existing IDs and workouts are preserved. Run `node scripts/enrichment/build-photo-expansion.mjs` to verify source hashes and rebuild this batch. See `public/exercise-media/photos/provenance.json` for the shipped files.

The remaining 11 held pairs, one rejected pair and 18 reference-only coaching links are still excluded from the app. Soccer ball skills and specific boxing drills need suitable demonstrations before a further media batch. The notes below are the original research snapshot, not the current catalog inventory. The hosted Chatbase source refresh was subsequently verified; see [the refresh record](../../CHATBASE_CATALOG_REFRESH.md). Editing local documents alone does not update the hosted agent.

Researched November 6, 2026. Research package only, no catalog changes, uploads or deployment.

Open [the visual preview](preview.html) to compare the photo pairs. The [manifest](manifest.json) records exact source URLs, revision, SHA-256 checksums, sizes, dimensions and review notes. The preview requires internet access for its images.

## What the app already has

The local catalog contains 213 exercises. Media is mapped for 184; 29 lack a mapping. This includes 32 functional-fitness additions already present, so cleans, snatches, ring muscle-ups and rope climbs are not new opportunities. Mapping coverage does not prove live media availability.

Boxing already has broad entries such as shadowboxing, heavy bag rounds, pad work, footwork and defensive drills, but no mapped demos for them. Add specific drills beneath those entries instead of duplicating them. Soccer needs actual ball skills as well as conditioning.

## First photo batch

These 12 candidates have the strongest initial still pairs in this review. They still need final instructions and editorial review before import. They are distinct variations of existing movements or new drills, not 12 unrelated movement families.

| Area | Candidates | Integration note |
| --- | --- | --- |
| Functional | Kettlebell renegade row; medicine-ball chest pass | Match equipment exactly; chest pass requires a partner. |
| Free weights | Chest-supported incline dumbbell row; reverse dumbbell lunge; neutral-grip dumbbell bench press; single-arm dumbbell shoulder press; alternating dumbbell press | Use explicit variation names so users can distinguish existing bilateral presses, bent-over rows and crossover lunges. |
| Calisthenics | Band-assisted pull-up; spider crawl; jump squat; suspended push-up | Suspended push-up photos use rings. Explain setup and any movement phases missing from the pair. |
| Athletic conditioning | Lateral bound | Supports sports conditioning, but does not replace soccer ball skills. |

Source: [free-exercise-db](https://github.com/yuhonas/free-exercise-db), pinned to `f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5`. The repository declares [Unlicense](https://raw.githubusercontent.com/yuhonas/free-exercise-db/f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5/LICENSE.md). This records the publisher's declaration, not independent verification of the rights to every original photograph.

All 48 downloaded photos decoded successfully, approximately 2.93 MB total. Each of the 24 pairs contains two distinct files. No selected source ID is already mapped by the app. Both images in every pair were visually screened on contact sheets.

Eleven pairs are held for clearer media: overhead slam, scoop throw, sledgehammer swing, tire flip, scaption, plyometric push-up, lateral cone hops, forward cone hops, single-cone sprint, single-leg hop progression and standing long jump. Common issues are missing landing phases, ambiguous movement direction or unclear camera angles. See individual notes in the manifest.

The push-up-to-side-plank pair is rejected: neither image shows the side plank. Do not turn that pair into a misleading GIF.

## CrossFit, boxing and soccer references

These are coaching references, not cleared downloadable media. Full video playback and duration have not been verified. No permission to copy, crop, trim, rehost or extract frames has been established. Link to the source while obtaining original or licensed demonstrations.

| Area | Six proposed movements or drills | Sources |
| --- | --- | --- |
| CrossFit movements | Wall-ball shot, barbell thruster, dumbbell thruster, double-under, kipping toes-to-bar, dumbbell power snatch | [CrossFit movement library](https://www.crossfit.com/crossfit-movements), individual movement URLs in manifest. |
| Boxing | Jab practice, virtual pad combinations, check hook, double-step footwork, ladder footwork, head movement | [England Boxing's coaching resource index](https://www.englandboxing.org/members/stay-active/). Treat these as drills within existing boxing entries. |
| Soccer | Inside-foot touches, sole-to-sole transfers, outside touch with sole pullback, Cruyff turn, low juggling, wall passing and first touch | [FIFA ball-control session](https://www.fifatrainingcentre.com/en/practice/elite-sessions/in-possession/mastering-ball-control.php), [Arlington Soccer's player resources](https://www.arlingtonsoccer.com/recplayerresources). |

The freely licensed Commons football video found during research is stop-motion, so it was rejected as a human technique demonstration. On November 6, the original [Boxer.webm](https://commons.wikimedia.org/wiki/File:Boxer.webm) was downloaded and decoded. A contact sheet sampled every 0.5 seconds across its 14.071 seconds shows general shadowboxing with direction changes and other athletes in frame, rather than an isolated drill sequence. It remains excluded from this batch. Its publisher lists Evworo and CC BY-SA 3.0; the manifest records its checksum, dimensions and review limits. Audio was not reviewed. The jab illustration is only one image. Neither solves the requested instructional sequence.

## Recommended media format and integration

1. Use two labeled stills for the first batch, without inventing a third pose. A two-photo GIF is a slideshow, not continuous technique footage. Photo order is not always start then finish.
2. For fast or complex skills, target a 5-10 second original or licensed MP4/WebM showing a complete movement, with a poster and user-controlled playback. This is a proposed production length, not a claim about the linked videos.
3. Keep instructions available in English and Spanish, with meaningful image descriptions, keyboard controls and a static option. Honor reduced-motion preferences. Auto-moving content lasting over five seconds alongside other content needs pause, stop or hide controls under [WCAG 2.2 SC 2.2.2](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html). Meaningful prerecorded audio needs captions under [SC 1.2.2](https://www.w3.org/WAI/WCAG22/Understanding/captions-prerecorded.html). Also provide the appropriate text or audio alternative for visual technique. These decisions alone do not establish full AA conformance.
4. Reuse the current self-hosted media approach. Keep source and license records, lazy-load images and request video only on demand. No paid exercise API or Anthropic integration is needed for this collection.
5. Add activity tags for boxing, soccer, calisthenics and functional training alongside existing muscle groups. Preserve existing exercise IDs and workout records. Boxing rounds and soccer drills need time or distance options, not only repetitions.
6. Before publishing, verify movement matching, translated names, image descriptions, mobile sizing, keyboard interaction, reduced motion, storage URLs and import/search behavior. Do not automatically publish the held or rejected pairs.

The separate color/accessibility release was verified and deployed on November 6, 2026, as commit `8e90ee7`; see [the verification record](../../COLOR_ACCESSIBILITY_REVIEW.md).
