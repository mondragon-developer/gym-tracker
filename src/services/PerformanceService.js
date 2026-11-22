const OPERATIONS = new Set(['workout.load', 'workout.save', 'workout.prepare']);
const OUTCOMES = new Set(['success', 'error', 'conflict', 'unauthenticated']);

/** In-memory operational metrics. No payloads, identifiers, or network exporter. */
export function createPerformanceRecorder({ enabled = false, capacity = 200, now = () => performance.now() } = {}) {
  const records = [];
  const limit = Math.max(1, Math.min(1000, Number.isFinite(capacity) ? Math.floor(capacity) : 200));

  const start = (operation) => {
    if (!enabled || !OPERATIONS.has(operation)) return () => {};
    const started = now();
    let finished = false;
    return ({ outcome = 'success', inputBytes, outputBytes } = {}) => {
      if (finished) return;
      finished = true;
      const record = {
        operation,
        durationMs: Math.max(0, now() - started),
        outcome: OUTCOMES.has(outcome) ? outcome : 'error'
      };
      for (const [key, value] of Object.entries({ inputBytes, outputBytes })) {
        try {
          const count = typeof value === 'function' ? value() : value;
          if (Number.isFinite(count) && count >= 0) record[key] = Math.round(count);
        } catch {
          // Diagnostics must not change persistence behavior.
        }
      }
      records.push(record);
      if (records.length > limit) records.splice(0, records.length - limit);
    };
  };

  return {
    start,
    snapshot: () => records.map(record => ({ ...record })),
    clear: () => { records.length = 0; },
    async measure(operation, task, { inputBytes, outputBytes } = {}) {
      if (!enabled) return task();
      const finish = start(operation);
      try {
        const value = await task();
        finish({
          outcome: value?.ok === false ? value.reason : 'success',
          inputBytes,
          outputBytes: outputBytes ? () => outputBytes(value) : undefined
        });
        return value;
      } catch (error) {
        finish({ outcome: 'error', inputBytes });
        throw error;
      }
    }
  };
}

export const payloadBytes = value => new TextEncoder().encode(JSON.stringify(value)).byteLength;
export const performanceRecorder = createPerformanceRecorder({
  enabled: import.meta.env.VITE_PERFORMANCE_DIAGNOSTICS === 'true'
});

export function installPerformanceDiagnostics() {
  if (import.meta.env.VITE_PERFORMANCE_DIAGNOSTICS !== 'true') return;
  window.gymPerformance = Object.freeze({
    snapshot: performanceRecorder.snapshot,
    clear: performanceRecorder.clear
  });
}
