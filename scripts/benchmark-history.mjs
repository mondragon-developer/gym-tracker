import { performance } from 'node:perf_hooks';
import { cpus, platform, arch } from 'node:os';
import WeekPlanService from '../src/services/WeekPlanService.js';
import workoutService from '../src/services/workoutService.js';

// Synthetic fixtures only. This benchmark never connects to Supabase.
const today = new Date('2026-11-16T12:00:00Z');
const weekMs = 7 * 24 * 60 * 60 * 1000;
const samples = 100;
const percentile = (values, p) => [...values].sort((a, b) => a - b)[Math.ceil(values.length * p) - 1];
const measure = task => {
  for (let i = 0; i < 10; i += 1) task();
  const durations = Array.from({ length: samples }, () => {
    const start = performance.now();
    task();
    return performance.now() - start;
  });
  return { p50Ms: percentile(durations, 0.50), p95Ms: percentile(durations, 0.95) };
};

const results = [1, 12, 52, 104].map(weeks => {
  const history = { version: 2, currentWeekStart: '2026-11-16', weeks: {} };
  for (let i = 0; i < weeks; i += 1) {
    const key = new Date(today.getTime() - i * weekMs).toISOString().slice(0, 10);
    history.weeks[key] = workoutService.getInitialPlan();
  }
  const encoded = JSON.stringify(history);
  return {
    weeks,
    payloadBytes: Buffer.byteLength(encoded),
    currentWeekBytes: Buffer.byteLength(JSON.stringify(history.weeks[history.currentWeekStart])),
    parse: measure(() => JSON.parse(encoded)),
    prepare: measure(() => WeekPlanService.migrate(history, today)),
    serialize: measure(() => JSON.stringify(history))
  };
});

console.log(JSON.stringify({
  scope: 'Synthetic local history processing; excludes network, database, and mobile-browser performance.',
  runtime: process.version,
  platform: `${platform()} ${arch()}`,
  cpu: cpus()[0]?.model,
  samplesPerOperation: samples,
  results
}, null, 2));
