# Boxing and soccer video release

November 6, 2026. Adds five specific drills, IDs 290-294, to the existing catalog. The library contains **230 exercises**, **201 with media**. Existing IDs and saved workouts are preserved.

| ID | Exercise | Category |
| --- | --- | --- |
| 290 | Boxing Forearm Block Drill | Combat |
| 291 | Boxing Punch Combination Drill | Combat |
| 292 | Boxing Feint Drill | Combat |
| 293 | Soccer Cone Dribbling | Cardio |
| 294 | Soccer Ball Juggling | Cardio |

All five log minutes. English and Spanish names work in exercise search and GYMPLAN imports. Each demo opens on a static poster. Selecting Play video mounts the native player with pause, seeking and replay controls. There is no looping or playback before that choice, including with reduced motion enabled. Media errors leave instructions and attribution visible. Descriptions and instructions are loaded on demand; the video files are excluded from the service worker's precache.

The five silent H.264 clips and five JPEG posters total **1,535,073 bytes**. The boxing originals remain 320 pixels wide, with the source borders and limited detail. Soccer footage is reduced to 720 pixels wide. There are no synthesized frames, speed changes or mirrored movements. These are short technique references, not complete lessons. See [the visual review](research/exercise-expansion/sports-review.md), [provenance](../public/exercise-media/sports/provenance.json) and [license notices](../THIRD_PARTY_NOTICES.md).

## Validation

- 509 tests passed in 70 files, including bilingual resolution, minutes-based imports, source/output checksums, equipment filtering, play-on-request behavior and media-error fallback.
- ESLint and production build passed. Vite still reports its existing main-bundle size warning. The new sports instructions are a separate lazy chunk.
- All ten output files fully decoded with FFmpeg. FFprobe confirmed five H.264 video streams and no audio tracks. The shipped clips are explicitly labeled silent and include written descriptions and instructions. Original narration was not transcribed or reviewed.
- React review: no new dependency, conditional media loading, lazy enrichment, named controls, adjacent text descriptions and existing modal focus behavior.
- Browser playback and responsive accessibility checks are pending browser availability. Automated component tests do not establish actual browser decoding.

The read-only production check is `node scripts/verify-sport-release.mjs`. It checks all five catalog names, deployed provenance, checksums and content types for all ten assets, and byte-range support for each video.

## Coach guides

Local English/Spanish guides 01, 02, 05, 06 and 08 and README.txt are updated for 230 exercises and 201 demos. This does not update the hosted Chatbase agent. Its last verified refresh still covers 225 exercises, as recorded in [the previous refresh](CHATBASE_CATALOG_REFRESH.md); hosted replacement and response checks remain pending.

The earlier 11 held photo pairs, rejected photo pair and 18 reference-only coaching links remain excluded. This release adds the five reviewed sports demonstrations only.
