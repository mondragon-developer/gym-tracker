// Checks the WCAG 2.2 contrast of the token pairs the UI relies on, in both
// themes, so a token edit cannot silently drop below AA. Run with
// `npm run check:contrast`; exits 1 on any failing pair.

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
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
};

const luminance = (hex) => {
  const [r, g, b] = hexToRgb(hex).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const ratio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// [foreground, background, minimum]. 4.5 for text, 3 for borders and icons.
const pairs = [
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
  ['border-strong', 'surface', 3], ['brand-border', 'surface', 3], ['focus', 'surface', 3],
  ['focus', 'surface-2', 3], ['focus', 'bg-page', 3],
  ['done-border', 'surface', 3], ['skipped-border', 'surface', 3], ['danger-border', 'surface', 3],
  ['info-border', 'surface', 3], ['accent-a-border', 'surface', 3], ['accent-b-border', 'surface', 3],
  ['done-border', 'done-soft', 3], ['skipped-border', 'skipped-soft', 3], ['danger-border', 'danger-soft', 3],
  ['info-border', 'info-soft', 3], ['accent-a-border', 'accent-a-soft', 3], ['accent-b-border', 'accent-b-soft', 3],
];

let failures = 0;
for (const [theme, block] of Object.entries(blocks)) {
  const tokens = parse(block);
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
}

if (failures > 0) {
  console.log(`\n${failures} pair(s) below AA`);
  process.exit(1);
}
console.log('\nall pairs pass');
