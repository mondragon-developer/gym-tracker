# Evaluating the squat pilot with real recordings

## Purpose and present evidence

This workflow compares completed repetitions and phase timing from the experimental side-view squat pilot with independently reviewed labels for the same recording. It does not establish technique quality, injury risk, spinal curvature, or biometric identity.

No real human recording is included in this change. The JSON files under `scripts/motion-evaluation/fixtures/` are deliberately synthetic examples for the comparison software. They contain invented timestamps and have no associated video. Their output must never be reported as human-pose validation.

The new command automates comparison of labels and exported observations. It does **not** decode a video, execute MediaPipe, or replay pixels automatically. The controlled pilot performs local video playback and inference; the command then compares its bounded export. Replaying an exported landmark sequence alone would test movement logic and would not test image recognition.

## First recording

Use an original recording that the participant has authorized for this evaluation. One recording is an initial functional check, not population-wide validation.

1. Start with approximately 15–30 seconds, one visible participant, and several comfortable bodyweight squats. The supported file limit remains two minutes and 100 MiB.
2. Use a stationary, approximately hip-height side view with a level camera. Keep the full body and feet in frame throughout the movement, with even lighting and space around the person.
3. Include a standing lead-in long enough to select the visible subject and complete calibration, plus a short standing period after the last repetition. Five seconds before the first movement is a practical recording starting point, not a validated requirement.
4. Use the original file for both annotation and app playback. Do not apply generated enhancement, frame interpolation, speed changes, or stabilization between the two steps.
5. Assign a non-identifying `clipId`, such as `squat-side-pilot-001`, and keep a local manifest associating that identifier with the original file, duration, device/browser used for the run, and reviewer. Identifiers contain 1–80 ASCII letters, digits, periods, underscores, or hyphens. A file digest can strengthen this local association. The comparator checks identifier and duration, not the actual video bytes.

Reference photographs and facial recognition are not required for this workflow. The selected body must remain observable in the supported exercise view.

## Independently annotate before tuning

For one short clip, manual frame-by-frame review and JSON labels are sufficient. [CVAT skeleton annotation](https://docs.cvat.ai/docs/annotation/manual-annotation/shapes/skeletons/) becomes useful for reviewing larger sets, visible joint positions, and occlusion. Its exported skeleton data is not automatically this command's repetition schema; a reviewer or a separately validated adapter must create the event labels below.

Review the intended participant throughout the complete recording. Label every complete attempted squat using one agreed definition of each source-video boundary:

| Field | Label definition |
| --- | --- |
| `startedAtMs` | First observable departure from standing into the descent |
| `bottomReachedAtMs` | Beginning of the lowest observable portion before the ascent |
| `ascentStartedAtMs` | Beginning of the ascent from that portion |
| `completedAtMs` | First return to the defined standing position |

All values are milliseconds on the original video's timeline, starting at zero. A bottom pause can have zero duration. Descent and ascent must have positive duration. Complete repetitions must be sorted and must not overlap.

These definitions need agreement between reviewers, especially for gradual reversals or uncertain endpoints. Resolve ambiguity before scoring. The evaluator's provisional thresholds are not the labeler's definition of truth. Do not silently copy the model's output into the reference labels and call it independent review.

Partial movements that do not satisfy the reviewed complete-repetition definition are not entered as complete reference repetitions. If the application incorrectly counts them, those predictions must remain visible as false positives. Keep a separate review log for partial movements, obscured joints, uncertain identity, and any disputed labels.

Save an annotation JSON file with this versioned schema:

```json
{
  "schemaVersion": 1,
  "kind": "squat-video-annotations",
  "clipId": "squat-side-pilot-001",
  "durationMs": 20000,
  "view": "side",
  "dataOrigin": "real_recording",
  "independentlyReviewed": true,
  "repetitions": [
    {
      "id": "rep-001",
      "startedAtMs": 6000,
      "bottomReachedAtMs": 7600,
      "ascentStartedAtMs": 7900,
      "completedAtMs": 9200
    }
  ]
}
```

The example values above illustrate the format; they are not measured results. Replace every relevant value with the independently reviewed recording's values. `independentlyReviewed: true` and `dataOrigin: real_recording` are reviewer declarations; the tool cannot independently verify them.

An optional `exclusions` array can describe sorted, non-overlapping setup or non-exercise intervals:

```json
{
  "startedAtMs": 0,
  "endedAtMs": 5000,
  "reason": "Standing setup before the first attempted repetition."
}
```

The name does not mean those intervals disappear from scoring. These entries are descriptive only. An exclusion must not overlap an annotated repetition, and unmatched predictions in those intervals still count as false positives. Never use exclusions to conceal missed attempts, tracking failures, or another person's movements.

## Capture an observed run

1. Use a controlled build with `VITE_ENABLE_SQUAT_PILOT=true`. Sign in, accept the normal terms, and open **Squat measurement pilot**.
2. Confirm the side-view setup. Enable the optional evaluation report before choosing a local video, and enter exactly the same `clipId` used in the labels.
3. Choose the original recording. Confirm the highlighted subject before the first movement and allow the standing baseline to be established.
4. Let the entire recording finish at normal speed. Download the measurement summary containing `evaluationTrace`.
5. Repeat with the same recording after a relevant change, retaining the versioned exports and the same independent annotations.

The evaluation export is opt-in for local video. It contains event timestamps, model/profile versions, and bounded processing diagnostics; it contains no pixels or landmark histories. It remains on the device until the reviewer explicitly saves or shares it.

For a full-clip comparison, the trace must declare `completed: true` and `truncated: false`. Ending early, losing the confirmed subject, restarting selection, or exceeding a collection cap makes the run unsuitable for this full-clip comparator. Do not change those flags manually to produce a score. Such sessions remain useful failure diagnostics and need a later interval/identity-aware evaluation schema.

## Run the comparison

From the repository root:

```bash
node scripts/motion-evaluation/compare.mjs \
  --annotations /absolute/path/squat-side-pilot-001-labels.json \
  --observations /absolute/path/squat-measurement-summary.json \
  --output /absolute/path/squat-side-pilot-001-comparison.json
```

The observations input can also be a standalone `evaluationTrace` object. Omitting `--output` writes the report to standard output. The command creates a new output file and refuses to overwrite an existing file. It exits with code 2 on missing, malformed, incompatible, incomplete, or truncated inputs. Each input is limited to 1 MiB; durations are limited to 120 seconds and repetition arrays to 200 entries.

The standalone observation format is:

```json
{
  "schemaVersion": 1,
  "kind": "squat-video-observations",
  "clipId": "squat-side-pilot-001",
  "durationMs": 20000,
  "sourceKind": "local_video",
  "completed": true,
  "truncated": false,
  "modelVersion": "recorded-model-version",
  "profileId": "bodyweight-squat-side",
  "profileVersion": "recorded-profile-version",
  "repetitions": [
    {
      "index": 1,
      "startedAtMs": 6100,
      "bottomReachedAtMs": 7650,
      "ascentStartedAtMs": 7950,
      "completedAtMs": 9250
    }
  ]
}
```

`profileId` must be `bodyweight-squat-side`; other exercises require their own evaluation contract. `trackingVersion` is optional. Optional `processing` has exactly `samples`, `inferenceMs: {p50, p95}`, and `frameLatencyMs: {p50, p95}`. Samples are capped at 2,400. Percentiles are nonnegative milliseconds, with `p95 >= p50`; both are `null` when there are zero samples. Unknown fields inside the annotation or observation schemas are rejected to prevent silently misreading incompatible exports. Other fields on an enclosing normal summary are permitted.

### Synthetic command check

This verifies only the comparison program:

```bash
node scripts/motion-evaluation/compare.mjs \
  --annotations scripts/motion-evaluation/fixtures/synthetic-annotations.json \
  --observations scripts/motion-evaluation/fixtures/synthetic-observations.json
```

The expected example result is one matched repetition and one missed reference repetition. The output explicitly labels the evidence `software-regression-only`. There is no real video behind the example.

## How to interpret the report

Matching is monotone and one-to-one: an observed repetition cannot satisfy two references, and a reference cannot absorb multiple observations. The algorithm first maximizes the number of matches, then minimizes absolute start/end error. Matching requires positive temporal overlap and start/end differences within a configured tolerance.

The default tolerance is 1,000 ms, recorded in the report's policy. This is an initial matching parameter, not a validated accuracy target. Specify another value with `--boundary-tolerance-ms NUMBER` before comparing experimental variants. Keep the policy fixed across those variants and report it with the results. Do not widen the tolerance only to make a disappointing run look successful.

| Output | Meaning |
| --- | --- |
| True positives | One-to-one matched complete repetitions under the specified matching policy |
| False positives | Predicted repetitions without a matched reference |
| False negatives | Reference repetitions without a matched prediction |
| Precision | Matched predictions divided by all predictions; `null` if there are no predictions |
| Recall | Matched references divided by all references; `null` if there are no references |
| F1 | Harmonic count-based measure; `null` when both sets are empty |
| Boundary error | Signed, absolute, and maximum error for each source-video boundary, among matched repetitions only |
| Phase duration error | Error in descent, bottom pause, ascent, and total duration, among matched repetitions only |
| Processing diagnostics | Exported inference and frame-admission-to-response p50/p95 values, when available |

A positive signed boundary error means the observation occurred later than the label. A positive duration error means the observed phase was longer. Missing repetitions have no measurable timing error and are reported separately; a low timing error must therefore be read together with recall.

Processing diagnostics are not source-video movement durations and are not total camera-to-display latency. Cold model loading, video decoding, UI drawing, sustained device heating, and battery effects need separate measurements on supported phones.

`subjectIdentity.assessed` and `techniqueQuality.assessed` remain false. This schema does not contain independently annotated identity trajectories or technique judgments. A repetition match is not proof that the correct person's joints were followed. Visually review the overlay and selection behavior.

## Expand the evaluation deliberately

After the first clean clip, add authorized recordings with different participants, clothing, lighting, backgrounds, supported camera placements, and representative devices. Keep recordings used for threshold tuning separate from held-out recordings used to assess the resulting change.

Maintain a separate failure set covering a second person entering, a crossing person, target departure/replacement, occlusion, camera movement, incomplete body visibility, and partial movements. Verify that uncertainty pauses measurement and that the application does not silently transfer to another person. The current full-clip comparator rejects interrupted runs; it must not turn appropriate abstention into a false claim of perfect tracking.

Record identity switches, incorrect resumptions, appropriate/unnecessary pauses, and coverage manually until an independently annotated identity/interval schema and scorer exist. Do not invent a zero identity-switch rate from absent labels.

Only establish release thresholds after reviewing the task definition, labeling consistency, participant/device coverage, and observed errors. A single successful recording or synthetic fixture cannot justify a movement-quality percentage.
