/** Nearest-rank processing percentiles. Call at finalization, not per frame. */
export const processingPercentiles = values => {
    if (!values.length) return { p50: null, p95: null };
    const sorted = [...values].sort((a, b) => a - b);
    return { p50: sorted[Math.ceil(sorted.length * 0.5) - 1], p95: sorted[Math.ceil(sorted.length * 0.95) - 1] };
};
