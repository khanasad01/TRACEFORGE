// WCAG 2.1 contrast checker for TRACEFORGE tokens.
// Usage: node scripts/check-contrast.cjs   (exit code 1 if any pair fails)
const fs = require('fs');
const path = require('path');

const FILE = path.resolve(__dirname, '..', 'src', 'styles', 'tokens.css');
const css = fs.readFileSync(FILE, 'utf8');

const tokens = {};
for (const m of css.matchAll(/--tf-color-([\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) {
  tokens[m[1]] = m[2];
}

const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const f = (x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const surfaces = ['canvas', 'card', 'panel', 'panel-hover', 'code-bg'];
const fgNames = Object.keys(tokens).filter(
  (n) =>
    (/^text-/.test(n) && n !== 'text-black') ||
    n === 'accent' ||
    n === 'accent-fg' ||
    /^(success|error|warning|info)(-fg|-muted)?$/.test(n),
);

let fails = 0;
const rows = [];
for (const fg of fgNames) {
  const cells = surfaces.map((s) => {
    const r = ratio(tokens[fg], tokens[s]);
    const ok = r >= 4.5;
    if (!ok) fails++;
    return `${r.toFixed(2)}${ok ? ' ok ' : ' FAIL'}`;
  });
  rows.push([fg, tokens[fg], ...cells]);
}

// status foreground on its own status background
const pairs = [];
for (const k of ['success', 'error', 'warning', 'info']) {
  const bg = tokens[`${k}-bg`];
  for (const suffix of ['', '-fg', '-muted']) {
    const fg = tokens[`${k}${suffix}`];
    if (bg && fg) {
      const r = ratio(fg, bg);
      const ok = r >= 4.5;
      if (!ok) fails++;
      pairs.push([`${k}${suffix} on ${k}-bg`, r.toFixed(2), ok ? 'ok' : 'FAIL']);
    }
  }
}

const pad = (s, n) => String(s).padEnd(n);
console.log(pad('token', 17) + pad('hex', 9) + surfaces.map((s) => pad(s, 13)).join(''));
for (const r of rows) console.log(pad(r[0], 17) + pad(r[1], 9) + r.slice(2).map((c) => pad(c, 13)).join(''));
console.log('\nstatus on own background');
for (const p of pairs) console.log(pad(p[0], 28) + pad(p[1], 7) + p[2]);
console.log(`\n${fails === 0 ? 'ALL PASS' : fails + ' FAILING PAIRS'} (threshold 4.5:1)`);
process.exit(fails === 0 ? 0 : 1);
