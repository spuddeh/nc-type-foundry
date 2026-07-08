// NC Type SVG generator. Geometry lives in glyph-data.cjs (the single source of truth);
// this script only renders it: one SVG per glyph, plus logo v3 and the monogram file.
// Winding is normalised here (solids one orientation, counters reversed) and every path
// carries fill-rule="nonzero". See the production checklist in ../README.md.
const fs = require('fs');
const path = require('path');
const { orient, GEO, PUNCT, MONOGRAM, LOGO_LETTERS, CAP_TOP, LOGO_SCALE } = require('./glyph-data.cjs');

const SVG_DIR = path.join(__dirname, '..', 'svg');
const DIST_DIR = path.join(__dirname, '..', 'dist');

const fmt = n => (Math.round(n * 10) / 10).toString();
const pathD = shapes => shapes.map(({ pts, counter }) => {
  const o = orient(pts, !counter);
  return 'M' + o.map(p => `${fmt(p[0])} ${fmt(p[1])}`).join(' L') + ' Z';
}).join(' ');

function writeGlyph(name, shapes) {
  const d = pathD(shapes);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-6.0 -16.0 152.0 140.0" width="304" height="280">\n  <rect x="-6" y="-16" width="152" height="140" fill="#0a0e14"></rect>\n  <path d="${d}" fill="#eaf2ff" fill-rule="nonzero"></path>\n</svg>`;
  fs.writeFileSync(path.join(SVG_DIR, name + '.svg'), svg);
}
for (const [g, shapes] of Object.entries(GEO)) writeGlyph(g, shapes);
for (const [g, shapes] of Object.entries(PUNCT)) writeGlyph(g, shapes);
console.log(`letters+digits: ${Object.keys(GEO).length}, punctuation: ${Object.keys(PUNCT).length}`);

// logo v3 (pure monogram + pure lettering at the original trace positions) + monogram file
const fmt2 = n => (Math.round(n * 100) / 100).toString();
const monoD = MONOGRAM.map(({ pts }) => 'M' + orient(pts, true).map(p => `${fmt2(p[0])} ${fmt2(p[1])}`).join(' L') + ' Z').join(' ');
const lettersD = LOGO_LETTERS.map(([L, x0]) =>
  GEO[L].map(({ pts, counter }) => {
    const o = orient(pts, !counter).map(([x, y]) => [x0 + x * LOGO_SCALE, CAP_TOP + y * LOGO_SCALE]);
    return 'M' + o.map(p => `${fmt2(p[0])} ${fmt2(p[1])}`).join(' L') + ' Z';
  }).join(' ')
).join(' ');
fs.mkdirSync(DIST_DIR, { recursive: true });
fs.writeFileSync(path.join(DIST_DIR, 'nightcorp_logo_v3.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" width="1546" height="1000" viewBox="0 0 154.55 100">\n<path d="${monoD} ${lettersD}" fill="#000000" fill-rule="nonzero"/>\n</svg>`);
fs.writeFileSync(path.join(DIST_DIR, 'nightcorp_monogram.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" width="1546" height="835" viewBox="0 0 154.55 83.45">\n<path d="${monoD}" fill="#000000" fill-rule="nonzero"/>\n</svg>`);
console.log('nightcorp_logo_v3.svg (1546x1000) + nightcorp_monogram.svg (1546x835) written');
