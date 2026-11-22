# Squat measurement pilot

## Status and purpose

This is an experimental, local measurement pilot for side-view bodyweight squats. It implements camera and local-video capture, pose inference in a worker, complete-cycle counting, phase timing, optional comparison with a user-selected timing target, and a downloadable compact summary.

It does not provide a technique percentage, identify an optimal tempo for a training objective, certify exercise safety, or automatically identify arbitrary exercises. Movement thresholds are provisional detector parameters. They have not been calibrated or validated against independent recordings of people performing squats.

The performance foundation is a prerequisite. Its PostgreSQL migration remains a separately reviewed database release; enabling this frontend pilot does not apply that SQL or create motion records in Supabase.

## Enabling a controlled build

The default is `VITE_ENABLE_SQUAT_PILOT=false`. Enable it in a local or controlled preview build:

```bash
VITE_ENABLE_SQUAT_PILOT=true npm run dev
VITE_ENABLE_SQUAT_PILOT=true npm run build
```

Use a current browser with module workers, transferable ImageBitmap, OffscreenCanvas, WebAssembly, and the worker GPU path required by MediaPipe. Camera access requires a secure origin, with localhost suitable for development. Unsupported initialization produces a visible error; the application does not move inference onto the UI thread as a fallback.

After normal authentication and terms acceptance, open **Squat measurement pilot** beside Weekly Summary. Confirm the side-view setup and start the camera or choose a local recording. Local recordings are limited to two minutes and 100 MiB, run at normal playback speed, and are never uploaded. Begin standing still before the first repetition so the evaluator can calibrate.

Finish the session to drain the last admitted frame and display confirmed measurements. Closing discards local state; downloading the JSON summary is an explicit user action. A page hide, seek, playback-rate change, or camera termination ends the current session. An incomplete or interrupted movement is excluded instead of being filled in from assumed positions.

## Camera placement and the meaning of a good movement

Camera placement belongs to the exercise evaluation profile. There is no universal best view for all criteria. The first candidate setup is a fixed, level side view, approximately at hip height, with the full body and feet visible. The person confirms this view explicitly. Landmark visibility and geometry checks can reject unsuitable images, but passing them does not prove correct camera orientation.

| Criterion | What the pilot does | Requirement for a later technique assessment |
| --- | --- | --- |
| Complete movement cycle | Detects descent, ascent, and return to the calibrated standing position | Validate counting against independently annotated attempted repetitions, including partial repetitions and tracking loss |
| Descent, pause, and ascent timing | Uses original video timestamps; compares with an optional explicit target | Validate phase boundaries and timing error, then define goal-specific targets with qualified review |
| Stance width | Reports unavailable from this profile | A separate frontal or suitable oblique view, scale normalization, and individualized target definitions |
| Inward knee movement | Reports unavailable | A separately validated frontal-plane evaluator; do not infer it from a side view |
| Trunk/spinal posture | Reports spinal curvature unavailable | Shoulder-to-hip landmarks represent gross trunk orientation, not segmental spinal curvature or bracing |
| Knee travel beyond the toes | Does not label it a universal fault | Consider task, depth, proportions, and loading; a single projected toe boundary is not a validated safety rule |
| Appropriate depth and overall technique | Reports unavailable | Define the specific task and population, obtain expert annotations, and validate each criterion before a composite score |

A small biomechanics experiment found that restricting forward knee travel shifted joint moments and trunk position. It did not establish an injury threshold or a universal pass/fail rule: [Fry et al., 2003](https://pubmed.ncbi.nlm.nih.gov/14636100/). Stance width and foot position also affect squat kinematics and loading: [Lorenzetti et al., 2018](https://link.springer.com/article/10.1186/s13102-018-0103-7). These findings motivate criterion-specific definitions; they do not validate this detector.

Google explicitly discusses the camera-angle sensitivity of two-dimensional angle heuristics in its [pose classification guidance](https://developers.google.com/ml-kit/vision/pose-detection/classifying-poses). The [MediaPipe pose representation](https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker) provides body landmarks, not a sequence of lumbar vertebrae. Therefore a shoulder-to-hip line cannot certify spinal curvature; that is a limitation inferred from the available representation.

Positive feedback is specific to an observed result: **“Your repetition timing matched the selected target.”** The pilot never translates pose confidence, valid-sample ratio, or a detected cycle into “99% perfect movement.” A future score needs a defined denominator, criterion coverage, independent labels, uncertainty calibration, and an abstention policy. Tracking confidence and technique quality are different quantities.

## Responsibilities and interfaces

The implementation applies SOLID through focused responsibilities and explicit boundaries. KISS keeps these boundaries small and concrete.

| Module | Responsibility |
| --- | --- |
| `SquatPilotModal` | Setup instructions, explicit target input, preview, feedback, and review/export of the local result |
| `useSquatSession` | Camera/video lifecycle, decoded-frame scheduling, source timestamps, React update throttling, and cleanup |
| `PoseWorkerClient` | One admitted frame, transfer ownership, worker lifecycle, timeouts, stale-session rejection, and finalization |
| `pose.worker` / `PoseWorkerRuntime` | MediaPipe adapter and worker protocol; pose inference stays off the UI thread |
| `SquatEvaluator` | Pure geometry validation, calibration, temporal state machine, timings, and bounded aggregates |
| `squatProfile` / `squatFeedback` | Versioned provisional parameters, supported criteria, and specific feedback |
| `AppUpdateService` | Deferred reload coordination across edits, saves, capture, and local result review |

The evaluator does not depend on React, camera APIs, Supabase, or a language model. Tests can inject a worker/detector without changing exercise rules. A later detector adapter must preserve the evaluator's landmark and timestamp contract. Do not introduce a general plugin framework until another implemented exercise or detector requires it.

## Latency and resource control

1. The video element displays the local camera or recording. No continuous video stream is sent to a server.
2. The hook attempts admission at most once per 50 ms of source time. A decoded-frame callback is preferred; animation-frame fallback uses `video.currentTime` and rejects duplicate timestamps.
3. The worker client reserves the only slot before asynchronous bitmap preparation, resizes to a maximum 640-pixel long edge, and transfers ownership to the worker. Busy frames are skipped. There is no accumulating queue.
4. The worker infers one pose and evaluates it. The inference clock is strictly increasing and separate from the original timestamps used to calculate movement durations.
5. The overlay draws the latest result directly. React measurements normally update at about 5 Hz, with immediate meaningful state/repetition events.
6. Finalization waits for the admitted frame before requesting a compact summary. Timeouts show an unfinished session; they do not manufacture a successful total.

Model initialization includes a warm-up inference. Initial model download and initialization are separate from steady-state inference. A warm cache reduces network work; it does not guarantee instant GPU startup. Frame preparation, inference, rendering, thermal throttling, battery, and browser behavior all require measurement on supported phones.

The UI exposes latest inference time and frame-admission-to-worker-response time. Neither is total camera-to-display latency. The summary records pipeline counters, completed/interrupted cycles, timing aggregates, model/profile versions, and valid/rejected sample counts. Valid-sample ratio describes supplied observations; it is not independently annotated attempted-repetition coverage.

## Caching and concurrent users

The MediaPipe package is pinned to `@mediapipe/tasks-vision@1.2.3`; the Google Lite model is the versioned float16/1 artifact. The build prepares the required runtime pair and model under versioned same-origin URLs. The model download is size- and digest-checked. These files are excluded from the ordinary PWA precache and use a bounded, version-specific runtime cache when requested. No personalized API response, recording, or movement result enters that cache.

The feature is conditionally imported, so a default build neither includes the pilot assets nor requires normal users to download them. A pilot build loads the UI and worker only when opened, and the large model files only when analysis starts.

The three uncompressed public artifacts total 20,780,146 bytes: 336,662 bytes of runtime loader JavaScript, 14,665,738 bytes of WASM, and the 5,777,746-byte model. The model SHA-256 is `59929e1d1ee95287735ddd833b19cf4ac46d29bc7afddbbf6753c459690d574a`. When changing artifact versions, retain the previous URLs for clients with active sessions and review old runtime-cache retention. A versioned URL must never silently serve different bytes.

For 100, 200, or 300 simultaneous camera users, each supported device performs its own inference. Server inference demand therefore does not grow with camera frame rate. Cold clients still create CDN bandwidth demand, and existing authentication/workout operations still create backend load. This architecture reduces centralized work; it does not prove a concurrency capacity.

Do not add Redis or another cache merely because video is involved. Reuse immutable model assets, keep private data scoped correctly, and measure actual query/write pressure. The existing Supabase PostgreSQL database remains the system of record for workouts. Motion measurements in this increment are local only. If later persisted, store one compact session summary and bounded repetition records separately from the existing whole-history JSONB document. Store optional private clips in object storage with explicit retention and access control, not in a database row or the public exercise-demo bucket.

An Anthropic API is not in the live feedback path. A later optional explanation can consume a compact validated summary after the session. It needs server-side credentials, bounded output/cost, timeout behavior, and idempotent request tracking; it must not determine joint positions or delay the local measurements. No API subscription or secret is required by this pilot.

## Validation and release gates

Automated tests cover synthetic geometry, phase state, original timestamps, confidence loss, framing drift, bounded state, worker backpressure, stale callbacks, bitmap ownership, timeouts, session finalization, permission races, playback readiness, and UI setup gates. Passing those tests establishes software behavior only.

### Verification recorded for this implementation

- The complete repository suite passed: **78 files and 637 tests**, with four workers.
- ESLint and both feature-disabled and feature-enabled production builds passed.
- The 86 pilot tests comprise 33 evaluator cases, 28 worker/client protocol cases, 21 capture lifecycle cases, and four UI cases.
- The disabled build emitted no pilot chunks or motion artifacts and performed no model download. Both builds retained 28 ordinary PWA precache entries.
- The enabled build's generated precache excludes the pilot UI/CSS, worker/SDK code, and motion artifacts. Its extra runtime cache is limited to the three pinned same-origin paths.
- Asset checks covered valid downloads, offline reuse of the build cache, corrupt cache/download rejection, wrong sizes, timeouts, and explicit network failure.
- Local serving returned the expected content types, sizes, and immutable headers; unknown artifact paths/versions returned 404, and POST returned 405.
- The enabled modal chunk was 23.15 kB minified / 8.16 kB gzip; its separate pose worker was 159.21 kB. These sizes do not establish startup or inference latency.

Actual Chromium inference and visual checks could not run in this execution environment: Chromium aborted because its required profile IPC socket operation was not permitted. No real recording or phone was evaluated. Browser/GPU compatibility, camera-to-display latency, mobile visual behavior, and exercise accuracy remain unverified. The default feature flag therefore remains disabled and the change is a draft pilot for review.

Before making technique or accuracy claims:

- Obtain an authorized side-view recording with a standing lead-in and annotate attempted repetitions and phase boundaries independently. Include partial repetitions and tracking-loss intervals.
- Test the same recording at different resolutions, aspect ratios, lighting, occlusion, movement speeds, and supported viewing angles. Keep a separate validation set for tuning decisions.
- Measure repetition precision/recall, phase timing error, abstention rate, and error among assessed movements. Include participants with varied proportions and clothing.
- Test representative iOS Safari/PWA and Android Chrome devices for cold/warm startup, p50/p95 processing latency, responsiveness, sustained sessions, thermal slowdown, interruption, cleanup, and offline warm-cache behavior.
- Exercise 100/200/300 authenticated staging users with realistic history load/save and cold-asset traffic. Record request rates, transferred bytes, backend latency/errors, conflict rates, and resource utilization. Do not run an unapproved load test against production.

Only add stance, spinal-posture, depth, or aggregate technique scores after their own supported view, reference criteria, labels, and acceptance thresholds are established. A single successful video is a feasibility check; it cannot establish population-wide reliability.
