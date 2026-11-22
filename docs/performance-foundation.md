# Performance foundation and camera readiness

## Scope

This increment prepares the existing application for the squat measurement pilot. The reviewed baseline is commit 497ec2fe5dc341904260990653adb2f22ecb9578. Database deployment and real-device capacity testing are separate release activities.

## Verified baseline

- 70 test files and 509 tests passed.
- ESLint passed.
- The production build passed.
- The primary application JavaScript chunk was 716.40 kB minified, 205.11 kB gzip.
- The service worker precached 28 entries totaling 1098.00 KiB.

Build timing and bundle sizes describe this checkout and toolchain. They do not establish mobile startup time or production concurrency.

## Changes and architectural boundaries

The administration service now requests bounded, stably ordered user pages and loads relationships for visible clients. Trainer selection has its own bounded lookup. The caller's invitation information is fetched independently so it cannot disappear when the list page changes.

AppUpdateService owns update coordination. Call appUpdates.protect() before protected work, retain the returned release function, and call it exactly once in finalization or cancellation cleanup. Overlapping activities are supported. Both service-worker updates and stale-chunk recovery use the same coordination path. The workout hook remains responsible for saving routine edits before an update can complete.

Foreground refreshes cannot replace edits created while a request is in flight. Account-bound persistence checks the expected caller, and completed saves from a previous account cannot modify the next account's version state.

A foreground return also waits for an initial load already in progress, and unmounted accounts cannot complete a deferred update or migrate browser history. Trainer edits and in-flight trainer saves hold independent update protection, including when a newer edit is made during the save.

PerformanceService owns opt-in, bounded operational measurements. It records allowed operation names, elapsed time, outcome categories, and optional byte counts. It stores no payloads or user identifiers and has no network exporter. Its default configuration is disabled.

These boundaries apply SOLID through focused responsibilities and explicit interfaces. KISS keeps the implementation small: no general plugin framework, separate caching server, or replacement state-management system is required by this increment.

## History preparation measurement

Complete archived weeks no longer allocate and discard a full default plan during migration. Defaults are created only when a day is missing. Existing normalization and missing-day behavior are retained.

The [recorded comparison](performance/history-processing.json) uses identical synthetic fixtures and three alternating baseline/optimized Node processes. The table reports the median of each run's preparation p50 and p95, in milliseconds.

| Stored weeks | Baseline p50 | Optimized p50 | Baseline p95 | Optimized p95 |
| --- | ---: | ---: | ---: | ---: |
| 1 | 0.053 | 0.008 | 0.196 | 0.037 |
| 12 | 0.541 | 0.033 | 0.797 | 0.105 |
| 52 | 2.441 | 0.163 | 3.028 | 0.365 |
| 104 | 5.112 | 0.395 | 6.195 | 0.947 |

These are local processing observations, not phone latency or end-to-end application measurements. The 104-week synthetic document is 485,423 bytes; this optimization does not reduce the whole-history database payload. Payload growth remains a reason to evaluate weekly records separately.

## Reproducing diagnostics

Run the existing test, lint, and build commands. Run npm run benchmark:history for synthetic history sizes and local parse, preparation, and serialization timings. It uses no real accounts and never connects to Supabase. Run it with a controlled runtime and compare the same fixtures; the output is not a mobile benchmark.

To inspect application timings in a controlled test build, set VITE_PERFORMANCE_DIAGNOSTICS=true. Open developer tools and call window.gymPerformance.snapshot() after routine load/save actions. Clear the bounded buffer with window.gymPerformance.clear(). The default retains at most 200 records. Byte measurements occur only when diagnostics are enabled and add measurement overhead.

Capture cold load, warm load, a foreground return, and an edited save separately. Record browser/device/network, history size, sample counts, p50/p95, errors, request counts, and bytes transferred. Keep permissions representative of actual owner/trainer behavior.

## Verification of this increment

- The foundation suite passed: 73 test files, 551 tests (`--maxWorkers=4 --exclude 'src/motion/**'`).
- After the final in-flight-save protection adjustment, the affected hook and update-coordinator suites passed all 36 tests again.
- ESLint and the production build passed. The resulting main JavaScript chunk is 719.07 kB minified / 206.10 kB gzip; the existing large-chunk warning remains.
- The SQL harness passed all three authorization suites before optimization, after optimization, and after rollback, plus scope, drift, and rollback checks.

## Remaining validation

The current history document remains a whole-history JSONB value. The benchmark and opt-in diagnostics provide evidence for deciding whether a weekly-record migration is necessary. New camera summaries must be kept separate regardless of that decision.

An isolated authorization harness validates the SQL optimization and rollback; consult the database runbook for exact commands and limitations. Do not infer managed-Supabase capacity from a local PostgreSQL harness.

The integrated pilot still requires camera-device tests, an authorized annotated video, and controlled 100/200/300-user workload tests. A successful build or synthetic movement fixture is not evidence of exercise-technique accuracy.
