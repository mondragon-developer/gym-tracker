// Checks configured color combinations, including action and header states.
// This is a contrast regression check, not a full WCAG conformance audit.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(here, '..', 'src', 'theme', 'tokens.css'), 'utf8');

const blocks = {
  light: css.slice(0, css.indexOf('@media (prefers-color-scheme: dark)')),
  dark: css.slice(css.indexOf(':root[data-theme="dark"]'), css.indexOf('@media (prefers-contrast: more)')),
};

const parse = (block) => {
  const tokens = {};
  for (const [, name, value] of block.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)) {
    tokens[name] = value.trim();
  }
  return tokens;
};

const hexToRgb = (hex) => {
  if (!/^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(hex)) throw new Error(`Unsupported color: ${hex}`);
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
};

const luminance = (hex) => {
  const [r, g, b] = hexToRgb(hex).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const ratio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// [foreground, background, minimum]. 4.5 for text, 3 for borders and icons.
const pairs = [
  ['on-action', 'action', 4.5], ['on-action', 'action-hover', 4.5],
  ['header-text', 'header-control', 4.5], ['header-text', 'header-control-hover', 4.5],
  ['header-control-border', 'header-control', 3], ['header-control-border', 'header-control-hover', 3],
  ['focus-inner', 'focus-outer', 3],
  ['text-inverse', 'done', 4.5], ['text-inverse', 'danger', 4.5], ['text-inverse', 'info', 4.5],
  ['text', 'surface', 4.5], ['text-2', 'surface', 4.5], ['text-3', 'surface', 4.5],
  ['text', 'surface-2', 4.5], ['text-2', 'surface-2', 4.5], ['text-3', 'surface-2', 4.5],
  ['text', 'surface-3', 4.5], ['text-2', 'surface-3', 4.5],
  ['brand', 'surface', 4.5], ['brand', 'surface-2', 4.5], ['brand', 'brand-soft', 4.5],
  ['brand-strong', 'surface', 4.5], ['on-brand', 'brand', 4.5],
  ['done', 'surface', 4.5], ['done', 'done-soft', 4.5],
  ['skipped', 'surface', 4.5], ['skipped', 'skipped-soft', 4.5],
  ['danger', 'surface', 4.5], ['danger', 'danger-soft', 4.5],
  ['info', 'surface', 4.5], ['info', 'info-soft', 4.5],
  ['accent-a', 'surface', 4.5], ['accent-a', 'accent-a-soft', 4.5],
  ['accent-b', 'surface', 4.5], ['accent-b', 'accent-b-soft', 4.5],
  ['on-day', 'day-open-bg', 4.5], ['on-day', 'day-today-bg', 4.5], ['on-day', 'day-idle-bg', 4.5],
  ['toast-text', 'toast-bg', 4.5],
  ['text-3', 'surface-3', 4.5], ['text-3', 'done-soft', 4.5], ['text-3', 'skipped-soft', 4.5], ['text-3', 'brand-soft', 4.5],
  ['text-3', 'info-soft', 4.5], ['text-3', 'accent-b-soft', 4.5],
  ['skipped', 'done-soft', 4.5], ['done', 'skipped-soft', 4.5], ['info', 'done-soft', 4.5], ['info', 'skipped-soft', 4.5],
  ['accent-a', 'done-soft', 4.5], ['accent-a', 'skipped-soft', 4.5], ['accent-b', 'done-soft', 4.5], ['accent-b', 'skipped-soft', 4.5],
  ['danger', 'done-soft', 3], ['danger', 'skipped-soft', 3], ['done', 'surface-3', 3], ['skipped', 'surface-3', 3], ['danger', 'surface-3', 3],
  ['border-strong', 'surface', 3], ['brand-border', 'surface', 3], ['focus', 'surface', 3],
  ['focus', 'surface-2', 3], ['focus', 'bg-page', 3],
  ['done-border', 'surface', 3], ['skipped-border', 'surface', 3], ['danger-border', 'surface', 3],
  ['info-border', 'surface', 3], ['accent-a-border', 'surface', 3], ['accent-b-border', 'surface', 3],
  ['done-border', 'done-soft', 3], ['skipped-border', 'skipped-soft', 3], ['danger-border', 'danger-soft', 3],
  ['info-border', 'info-soft', 3], ['accent-a-border', 'accent-a-soft', 3], ['accent-b-border', 'accent-b-soft', 3],
];

let failures = 0;
for (const [theme, block] of Object.entries(blocks)) {
  const tokens = { ...parse(blocks.light), ...parse(block) };
  for (const [fg, bg, min] of pairs) {
    if (!tokens[fg] || !tokens[bg]) {
      console.log(`${theme}: missing token ${fg} or ${bg}`);
      failures += 1;
      continue;
    }
    const r = ratio(tokens[fg], tokens[bg]);
    const ok = r >= min;
    if (!ok) failures += 1;
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${theme.padEnd(5)} ${fg.padEnd(16)} on ${bg.padEnd(16)} ${r.toFixed(2)} (min ${min})`);
  }
  // Both opaque header stops are dark enough for normal text. Check muted
  // text too, instead of assuming a large heading's 3:1 threshold applies.
  const stops = tokens['header-bg'].match(/#[\da-f]{6}/gi) || [];
  if (!stops.length) throw new Error(`No header colors in ${theme}`);
  for (const stop of stops) {
    for (const foreground of ['header-text', 'header-muted']) {
      const contrast = ratio(tokens[foreground], stop);
      if (contrast < 4.5) failures++;
      console.log(`${contrast >= 4.5 ? 'ok  ' : 'FAIL'} ${theme} ${foreground} on header ${stop}: ${contrast.toFixed(2)}`);
    }
  }
  for (const background of ['surface', 'surface-2', 'surface-3', 'bg-page', 'toast-bg', 'action', 'action-hover', 'day-open-bg', 'day-today-bg', 'day-idle-bg', 'header-control', 'header-control-hover', 'done-soft', 'skipped-soft', 'danger-soft']) {
    const contrast = Math.max(ratio(tokens['focus-inner'], tokens[background]), ratio(tokens['focus-outer'], tokens[background]));
    if (contrast < 3) failures++;
    console.log(`${contrast >= 3 ? 'ok  ' : 'FAIL'} ${theme} two-color focus on ${background}: ${contrast.toFixed(2)}`);
  }
}

const autoDark = parse(css.slice(css.indexOf('@media (prefers-color-scheme: dark)'), css.indexOf(':root[data-theme="dark"]')));
const manualDark = parse(blocks.dark);
if (JSON.stringify(autoDark) !== JSON.stringify(manualDark)) {
  failures++;
  console.log('FAIL system and manual dark theme tokens differ');
}

if (failures > 0) {
  console.log(`\n${failures} pair(s) below AA`);
  process.exit(1);
}
console.log('\nall pairs pass');
