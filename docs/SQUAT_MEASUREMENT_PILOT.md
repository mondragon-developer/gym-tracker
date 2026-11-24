# Squat measurement pilot

## Status and purpose

This is an experimental, local measurement pilot for side-view bodyweight squats. It implements camera and local-video capture, explicit subject confirmation, bounded subject continuity checks, pose inference in a worker, complete-cycle counting, phase timing, optional comparison with a user-selected timing target, and a downloadable compact summary. An optional local-video evaluation export supports comparison with independent annotations.

It does not provide a technique percentage, identify an optimal tempo for a training objective, certify exercise safety, or automatically identify arbitrary exercises. Movement thresholds are provisional detector parameters. They have not been independently validated on held-out recordings of people performing squats.

The performance foundation is a prerequisite. Its PostgreSQL migration remains a separately reviewed database release; enabling this frontend pilot does not apply that SQL or create motion records in Supabase.

## Enabling a controlled build

The default is `VITE_ENABLE_SQUAT_PILOT=false`. Enable it in a local or controlled preview build:

```bash
VITE_ENABLE_SQUAT_PILOT=true npm run dev
VITE_ENABLE_SQUAT_PILOT=true npm run build
```

Use a current browser with module workers, transferable ImageBitmap, OffscreenCanvas, WebAssembly, and the worker GPU path required by MediaPipe. Camera access requires a secure origin, with localhost suitable for development. Unsupported initialization produces a visible error; the application does not move inference onto the UI thread as a fallback.

After normal authentication and terms acceptance, open **Squat measurement pilot** beside Weekly Summary. Confirm the side-view setup and start the camera or choose a local recording. The preview first checks that one eligible body remains continuously visible. Then check the highlighted body and select **Measure highlighted person**. No movement frames reach the evaluator before this explicit confirmation. Local recordings briefly freeze each inspected preview frame during preparation and inference, advance while subject qualification is incomplete, and remain paused once confirmation is available. Playback resumes after the worker acknowledges confirmation. Camera previews continue updating. Begin standing still before the first repetition so the evaluator can calibrate. Local recordings are limited to two minutes and 100 MiB, run at normal playback speed, and are never uploaded.

Finish the session to drain the last admitted frame and display confirmed measurements. Closing discards local state; downloading the JSON summary is an explicit user action. A page hide, seek, playback-rate change, or camera termination ends the current session. An incomplete or interrupted movement is excluded instead of being filled in from assumed positions.

## Subject selection and interruption

The worker requests at most two poses. Tracker version `0.2.0-experimental` requires the same geometrically continuous, eligible candidate for at least **300 ms of original source time and six eligible observations** before issuing a session-scoped confirmation token. Both conditions must hold. Until then, the candidate can be highlighted, but the status is `unavailable` with reason `subject_stabilizing` and confirmation remains disabled. The duration and observation count are provisional engineering parameters, not independently validated accuracy criteria.

A missing, ambiguous, unusable, discontinuous, or excessively delayed observation before confirmation resets qualification and invalidates any offered token. Reacquisition requires the complete qualification interval again. The tracker retains one candidate, one start timestamp, a capped observation count, and one token; it does not retain a frame history. An eligible token still requires explicit user confirmation and is not a person identifier or face-recognition enrollment. This startup gate does not validate camera orientation or movement quality.

After confirmation, a missing pose, an additional returned pose, an excessive observation gap, implausible movement/scale, or an exercise-specific geometry failure terminates the measurement segment. Previously completed measurements remain available; the active repetition and calibration are invalidated. A new session is required to select a person again. The worker will not silently resume with another candidate or combine their measurements into the completed segment.

This is a conservative, provisional geometry policy. Similar people replacing one another without an observable discontinuity may still be confused. Two requested pose outputs cannot establish that every bystander was detected, and multi-pose inference cost requires measurement on phones. The pilot therefore supports one clearly visible person; crowded-gym accuracy is not established. Front/back reference photographs are not required by this implementation.

## Timing onset and bounded uncertainty

Profile version `0.3.0-experimental` retains an existing descent-start candidate through a brief rebound below the knee-angle start threshold only when hip motion continues to corroborate descent. The hip must move downward relative to the preceding eligible observation, satisfy the existing standing-relative hip-displacement threshold, and progress by that same displacement threshold from the candidate's hip anchor. Weak knee evidence expires at the existing **100 ms source-time evidence deadline**, including when the first recovered observation arrives exactly at that deadline. These are provisional detection rules, not biomechanical correctness limits.

When knee evidence recovers, the hip anchor retains the furthest downward position among its previous value, the last retained weak observation, and the recovery observation. It cannot move upward and make the same hip excursion count as fresh progress again. A later rebound therefore requires additional hip descent. Stationary or rising hips, insufficient corroboration, and the existing capture interruptions clear the candidate as applicable. The change adds two scalar fields to the existing candidate and does not retain a trajectory, add inference calls, or change numerical thresholds. Cycle confirmation still requires the existing knee excursion, hip excursion, and temporal evidence.

An initial descent candidate is supported for **less than 5,000 ms of source time**, measured from its existing backdated onset. Expiry is checked before recovery or cycle confirmation, including when the confirming observation arrives exactly at the deadline. The evaluator discards the candidate and enters `awaiting_standing`; it does not invent a later onset. Capture, the confirmed subject, standing calibration, and completed measurements remain available.

Re-arming requires knee drop strictly below the existing 5-degree start threshold and hip displacement below the existing 0.015-leg-length start threshold, both sustained for the existing 150 ms standing-evidence interval. A held posture in the overlapping 5–7-degree return band cannot immediately re-arm. This adds two scalar recovery fields and a `startRecoveryRequired` summary flag, with no frame history or additional inference.

The five-second budget is a provisional supported-start-duration policy. Intentional pauses or very slow starts that confirm at or after the deadline are excluded until standing recovery; they are not graded as incorrectly performed. A shorter hold can still contribute to measured descent duration. Broader onset semantics and accuracy require separate labeled evaluation; these development examples do not establish a general error bound.

## Real-recording evaluation

For a local recording, expand **Recording evaluation**, enable **Collect an evaluation report**, and provide an anonymous recording identifier matching independent annotation metadata. The summary then includes bounded source-time repetition events and processing latency percentiles. This option is unavailable for camera sessions. It retains neither frames nor landmark trajectories and makes no network request.

The evaluator command is `npm run evaluate:squat-video -- --annotations <labels.json> --observations <summary.json>`. It validates both schemas and compares complete recordings using one-to-one temporal matching. Incomplete or truncated recordings are rejected for full-recording scoring. Identity tracking and technique quality are explicitly unassessed by that comparator. See [SQUAT_VIDEO_EVALUATION.md](SQUAT_VIDEO_EVALUATION.md) for the recording, annotation, and review procedure.

Bundled numerical examples are explicitly marked `synthetic_fixture` / `software-regression-only`. They verify the comparison tool, not human recognition. Real footage and independent labels remain necessary.

## Camera placement and the meaning of a good movement

Camera placement belongs to the exercise evaluation profile. There is no universal best view for all criteria. The first candidate setup is a fixed, level side view, approximately at hip height, with the full body and feet visible. The person confirms this view explicitly. Landmark visibility and geometry checks can reject unsuitable images, but passing them does not prove correct camera orientation.

The setup includes an accessible top-down placement diagram: the phone views the person from either side, perpendicular to the direction the person faces. The instructions ask the person to face left or right across the preview, keep the torso and hips in side profile, and keep the near-side shoulder-to-foot chain visible. The diagram is static and adds no inference or network request. It does not measure or certify camera orientation.

When capture terminates, the interface preserves the specific reason from the subject-tracking summary or latest observation. An unsupported view asks for side placement, inconsistent projected geometry asks for a fixed phone and clear framing, and unavailable landmarks ask for visibility of the required near-side points. These messages do not assert that a person physically moved or left the scene. Completed measurements and the existing restart policy are unchanged.

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
| `SubjectTracker` | Explicit candidate confirmation and bounded geometry continuity; terminal loss policy |
| `SquatEvaluator` | Pure geometry validation, calibration, temporal state machine, timings, and bounded aggregates |
| `EvaluationRecorder` | Opt-in local-file repetition events and bounded processing samples; no image or landmark history |
| `ProcessingRecorder` | Fixed-window camera processing samples and finalization-only percentiles; no pixels or landmark history |
| `scripts/motion-evaluation` | Strict independent-annotation comparison and a local CLI outside the application bundle |
| `squatProfile` / `squatFeedback` | Versioned provisional parameters, supported criteria, and specific feedback |
| `AppUpdateService` | Deferred reload coordination across edits, saves, capture, and local result review |

The evaluator does not depend on React, camera APIs, Supabase, or a language model. Tests can inject a worker/detector without changing exercise rules. A later detector adapter must preserve the evaluator's landmark and timestamp contract. Do not introduce a general plugin framework until another implemented exercise or detector requires it.

## Latency and resource control

1. The video element displays the local camera or recording. No continuous video stream is sent to a server.
2. The hook attempts admission at most once per 50 ms of source time. A decoded-frame callback is preferred; animation-frame fallback uses `video.currentTime` and rejects duplicate timestamps.
3. The worker client reserves the only slot before asynchronous bitmap preparation, resizes to a maximum 640-pixel long edge, and transfers ownership to the worker. Busy frames are skipped. There is no accumulating queue.
4. The worker requests up to two poses, checks subject continuity, and evaluates only the explicitly confirmed subject. An additional returned pose interrupts measurement. The inference clock is strictly increasing and separate from the original timestamps used to calculate movement durations.
5. The overlay draws the latest result directly. React measurements normally update at about 5 Hz, with immediate meaningful state/repetition events.
6. Finalization waits for the admitted frame before requesting a compact summary. Timeouts show an unfinished session; they do not manufacture a successful total.

Model initialization includes a warm-up inference. Initial model download and initialization are separate from steady-state inference. A warm cache reduces network work; it does not guarantee instant GPU startup. Frame preparation, inference, rendering, thermal throttling, battery, and browser behavior all require measurement on supported phones.

The UI exposes latest inference time and frame-admission-to-worker-response time. Neither is total camera-to-display latency. The summary records pipeline counters, completed/interrupted cycles, timing aggregates, model/profile/tracking versions, and valid/rejected sample counts. Valid-sample ratio describes supplied observations; it is not independently annotated attempted-repetition coverage. Existing pipeline counters are not a complete count of decoded frames skipped by admission throttling or a busy worker.

Camera summaries also contain `processingDiagnostics` with the latest **2,400 valid timing pairs**, held in two fixed `Float64Array` buffers (38,400 bytes of pair storage). Recording has constant work per received response. Nearest-rank p50/p95 values are computed once after the final admitted response is drained. Observed, valid, invalid, retained, and overwritten counts make the window's coverage explicit. After replacement begins, the percentiles describe the recent window, not the full session. Invalid, skipped, and failed results do not become zero-latency samples. Samples include subject setup; frame latency ends at the worker response and excludes camera capture and display presentation.

Camera preparation uses a separate monotonic clock. `workerReady` includes worker creation, runtime/model loading when needed, initialization, and warm-up. `mediaReady` includes permission response time, camera startup, and playable-video readiness. `sessionReady` ends after both preparations and final playback readiness, before subject confirmation and standing calibration. These intervals overlap and must not be added. They do not separately measure network transfer or establish whether assets were served from a cold or warm cache. Cancellation and stale callbacks cannot modify a later session's values.

The existing opt-in local-file evaluation schema is unchanged: it retains at most 200 repetition events and 2,400 processing-sample pairs. Any overflow is disclosed as truncation and cannot be scored as a complete recording. Camera diagnostics are a separate summary field, not a file-evaluation trace. Both remain on the device unless the user explicitly downloads and shares the summary.

## First controlled phone test

Use the enabled HTTPS preview in a direct Chrome tab on the test iPhone. Record the actual iPhone model, iOS version, and Chrome version with the result; the reported device name alone does not establish hardware or browser support. Preview deployment protection and ordinary application sign-in both remain active. A protected share link may expire. Email/password sign-in uses the existing account directly; Google OAuth and password-recovery links require the preview origin in the Supabase redirect allowlist. A Google-only account may not have a password. Keep the production Site URL and access controls intact.

1. Open **Squat measurement pilot**. Use a helper behind the phone, outside its camera view, for the first live test. The helper can confirm the subject and finish the session without the subject approaching or moving the camera. Solo timed or remote confirmation is not implemented.
2. Place the phone level on a stable support at approximately hip height, directly beside the subject. Keep the full body and feet visible with margin throughout the movement. Check the actual rear-camera field of view. The normal 1× lens is setup guidance; the current camera constraints do not select a physical lens or set zoom.
3. Confirm the side-view checkbox, leave the custom timing target off, and select **Start camera**. Allow camera access. Keep this tab visible and the screen awake. First use downloads the pinned model/runtime assets; an initialization error must be reported rather than interpreted as a movement failure.
4. With one person clearly visible, wait for **Measure highlighted person** to become available. Have the helper select it, then remain standing until **Ready to begin** appears. Perform a short set of approximately five comfortable bodyweight repetitions without a deliberate extended shallow hold. This is a measurement test, not a prescribed optimal tempo or technique assessment.
5. Remain in frame while the helper selects **Finish session**. Expand **Session diagnostics**, then select **Download measurement summary** before closing or starting another session. Retain the JSON as the initial-run result; confirm that camera use ends after finalization.
6. Repeat the same short session without clearing site data and save its summary separately. Label it a repeat run, not a proven warm-cache benchmark. Report visible freezes, delayed feedback, initialization errors, camera selection, counted versus attempted repetitions, and any interruption message alongside the two summaries.

The existing authorized recording can also be selected through **Choose local video** to isolate playback and worker startup from live-camera positioning. If collecting an evaluation report, use its frozen anonymous recording identifier and the existing independent annotations. A successful file test does not establish live-camera performance. Browser/GPU startup, true camera-to-display latency, sustained thermal behavior, and capture cleanup require actual device observation; local unit tests and CPU replay do not replace those checks.

## Caching and concurrent users

The MediaPipe package is pinned to `@mediapipe/tasks-vision@1.2.3`; the Google Lite model is the versioned float16/1 artifact. The build prepares the required runtime pair and model under versioned same-origin URLs. The model download is size- and digest-checked. These files are excluded from the ordinary PWA precache and use a bounded, version-specific runtime cache when requested. No personalized API response, recording, or movement result enters that cache.

The feature is conditionally imported, so a default build neither includes the pilot assets nor requires normal users to download them. A pilot build loads the UI and worker only when opened, and the large model files only when analysis starts.

The three uncompressed public artifacts total 20,780,146 bytes: 336,662 bytes of runtime loader JavaScript, 14,665,738 bytes of WASM, and the 5,777,746-byte model. The model SHA-256 is `59929e1d1ee95287735ddd833b19cf4ac46d29bc7afddbbf6753c459690d574a`. When changing artifact versions, retain the previous URLs for clients with active sessions and review old runtime-cache retention. A versioned URL must never silently serve different bytes.

For 100, 200, or 300 simultaneous camera users, each supported device performs its own inference. Server inference demand therefore does not grow with camera frame rate. Cold clients still create CDN bandwidth demand, and existing authentication/workout operations still create backend load. This architecture reduces centralized work; it does not prove a concurrency capacity.

Do not add Redis or another cache merely because video is involved. Reuse immutable model assets, keep private data scoped correctly, and measure actual query/write pressure. The existing Supabase PostgreSQL database remains the system of record for workouts. Motion measurements in this increment are local only. If later persisted, store one compact session summary and bounded repetition records separately from the existing whole-history JSONB document. Store optional private clips in object storage with explicit retention and access control, not in a database row or the public exercise-demo bucket.

An Anthropic API is not in the live feedback path. A later optional explanation can consume a compact validated summary after the session. It needs server-side credentials, bounded output/cost, timeout behavior, and idempotent request tracking; it must not determine joint positions or delay the local measurements. No API subscription or secret is required by this pilot.

## Validation and release gates

Automated tests cover synthetic geometry, phase state, original timestamps, confidence loss, framing drift, bounded state, worker backpressure, stale callbacks, bitmap ownership, timeouts, session finalization, permission races, playback readiness, and UI setup gates. Passing those tests establishes software behavior only.

### Camera diagnostics and pending-start checkpoint

- The complete repository suite passed: **82 files and 790 tests**. Full ESLint and whitespace checks passed. Independent review also ran the 66 affected diagnostics/lifecycle/UI tests and all 63 evaluator tests without a blocker.
- New cases cover fixed-window wraparound, invalid timing pairs, final-frame draining, cancellation and stale preparation callbacks, unavailable measurements, and preservation of the local-file evaluation schema.
- Pending-start cases cover confirmation at 4,999/5,000/5,001 ms, continuous slow starts within the budget, excluded starts beyond it, prolonged shallow holds, the overlapping return band, hip recovery, weak evidence, timestamp/gap handling, reset, and preservation of completed measurements.
- Replaying the same four development recordings through the reviewed production worker/tracker/evaluator preserved all previous counts (0, 0, 4, 4), terminal outcomes, tracking, processed-sample totals, and repetition timings. None of those recordings exercises the new five-second abstention rule. The frozen AI visual interval comparison remains 12 of 16 boundaries inside its provisional intervals, with a maximum outside distance of approximately 0.067 seconds; this is not a general accuracy bound.
- Feature-disabled and feature-enabled production builds passed. The disabled build emitted zero pilot/model assets. Both retained 28 ordinary precache entries, excluding all optional pilot/model files. The enabled worker is 166.14 kB; the pilot UI chunk is 39.04 kB minified / 12.81 kB gzip. The existing main-bundle size warning remains.
- The three pinned model/runtime artifacts remain 20,780,146 bytes, with the same verified model digest. Camera diagnostics add 38,400 bytes of timing-pair storage and no server telemetry, video upload, motion database write, or cloud-model request.
- No actual iPhone execution or browser/GPU timing is established by this checkpoint. The first controlled phone protocol above remains necessary. The profile is `0.3.0-experimental`; subject tracking remains `0.2.0-experimental`.

### Real-recording development and timing follow-up

The results in this subsection predate the camera-diagnostics and pending-start checkpoint above.

- The complete repository suite passed: **81 files and 765 tests**. Full ESLint and both feature-disabled and feature-enabled production builds passed.
- The evaluator's 47 tests include brief knee rebounds, exact source-time deadlines, stationary/rising hips, repeated correlated noise, and capture interruption. Independent review exposed a larger hip/knee oscillation that could reuse the same excursion; the corrected non-regressing anchor passes that counterexample and the full suite.
- The camera component's 19 tests cover explicit setup confirmation, accessible placement guidance, preserved counts, reason-specific interruptions, and stop-cause precedence. The static diagram was rendered and visually inspected; this was not a full-browser or phone visual test.
- Four private development recordings were processed with genuine CPU pose-model observations and replayed through the actual application worker, tracker, and evaluator. The latest side-view replay measured four cycles without a postconfirmation interruption. The timing refinement corrected two late departure estimates while preserving the other phase boundaries and all earlier recording outcomes.
- The reference intervals were frozen before comparison and were not widened. They come from a provisional AI visual review, not expert-verified ground truth. These recordings informed development and are not a held-out validation set. The successful inference runtime was Python MediaPipe `0.10.21` on CPU, using the pinned model; numerical equivalence to the application's JavaScript `1.2.3` GPU runtime is unverified.
- The disabled build emitted zero pilot/model files. Both builds retained 28 ordinary precache entries; the enabled precache excludes the pilot UI/CSS, worker, model, and runtime files.
- The enabled pilot chunk was 34.97 kB minified / 11.62 kB gzip, and its worker was 165.58 kB. The three pinned model/runtime artifacts remain 20,780,146 bytes. These are build sizes, not latency measurements. The existing main-bundle size warning remains.
- Startup qualification and timing refinement retain bounded state. No additional inference calls, frame history, video upload, motion database write, or cloud-model dependency was introduced. Private recordings and landmark trajectories are excluded from the repository.

The feature remains disabled by default and the pull request remains a draft. The remaining release gates below still apply, including actual phone execution, supported-view validation, independent timing labels, and authenticated staging load.

### Subject selection and evaluation checkpoint

The results in this subsection predate the private real-recording diagnostics and subsequent refinements.

- The complete repository suite passed: **81 files and 726 tests**, including 175 motion, capture, UI, and comparison cases.
- ESLint and both feature-disabled and feature-enabled production builds passed.
- Confirmation acknowledgements are scoped to the current session and candidate token. Tests cover stale tokens, cancellation, deadlines, terminal loss, and retention of completed results.
- Local-file candidate capture freezes before bitmap preparation, so inference delay does not advance the preview away from the confirmed image. A still-paused, unchanged frame remains admissible through slow preparation while retaining the five-second frame deadline. Tests cover resuming preview when no candidate is found and cancellation during resumed playback.
- The recorder-to-comparator schema contract passed. Comparator tests cover missing/extra repetitions, one-to-one matching, timing, incompatible/incomplete inputs, and explicit synthetic evidence labels. Its bundled example ran as a software-only regression check.
- The disabled build emitted zero pilot/model files. Both builds retained 28 ordinary precache entries; the enabled precache excludes the pilot, worker, and model/runtime files.
- The enabled pilot chunk was 32.22 kB minified / 10.72 kB gzip, and the pose worker was 164.66 kB. The three pinned model/runtime artifacts remain 20,780,146 bytes.
- No real human recording or phone was evaluated. These changes do not establish recognition accuracy, bystander recall, identity-switch rates, mobile compatibility, or latency targets. The existing default-disabled draft status remains appropriate.

### Initial pilot verification before subject selection was added

- The complete repository suite passed: **78 files and 637 tests**, with four workers.
- ESLint and both feature-disabled and feature-enabled production builds passed.
- The 86 pilot tests comprise 33 evaluator cases, 28 worker/client protocol cases, 21 capture lifecycle cases, and four UI cases.
- The disabled build emitted no pilot chunks or motion artifacts and performed no model download. Both builds retained 28 ordinary PWA precache entries.
- The enabled build's generated precache excludes the pilot UI/CSS, worker/SDK code, and motion artifacts. Its extra runtime cache is limited to the three pinned same-origin paths.
- Asset checks covered valid downloads, offline reuse of the build cache, corrupt cache/download rejection, wrong sizes, timeouts, and explicit network failure.
- Local serving returned the expected content types, sizes, and immutable headers; unknown artifact paths/versions returned 404, and POST returned 405.
- The enabled modal chunk was 23.15 kB minified / 8.16 kB gzip; its separate pose worker was 159.21 kB. These sizes do not establish startup or inference latency.

Actual Chromium inference and full-browser visual checks could not run in this execution environment: Chromium aborted because its required profile IPC socket operation was not permitted. Subsequent private diagnostics used genuine model observations from user-provided recordings in a CPU runtime, replayed through the application logic. They do not exercise the browser's GPU pipeline, capture scheduling, or interactive confirmation. Browser/GPU compatibility, camera-to-display latency, mobile visual behavior, and exercise accuracy remain unverified. The default feature flag therefore remains disabled and the change is a draft pilot for review.

Before making technique or accuracy claims:

- Obtain an authorized side-view recording with a standing lead-in and annotate attempted repetitions and phase boundaries independently. Include partial repetitions and tracking-loss intervals.
- Test the same recording at different resolutions, aspect ratios, lighting, occlusion, movement speeds, and supported viewing angles. Keep a separate validation set for tuning decisions.
- Measure repetition precision/recall, phase timing error, abstention rate, and error among assessed movements. Include participants with varied proportions and clothing.
- Test representative iOS Chrome/Safari/PWA and Android Chrome devices for cold/warm startup, p50/p95 processing latency, responsiveness, sustained sessions, thermal slowdown, interruption, cleanup, and offline warm-cache behavior.
- Exercise 100/200/300 authenticated staging users with realistic history load/save and cold-asset traffic. Record request rates, transferred bytes, backend latency/errors, conflict rates, and resource utilization. Do not run an unapproved load test against production.

Only add stance, spinal-posture, depth, or aggregate technique scores after their own supported view, reference criteria, labels, and acceptance thresholds are established. A single successful video is a feasibility check; it cannot establish population-wide reliability.
