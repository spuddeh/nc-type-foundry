// NC Type font compiler: glyph-data.cjs -> ../dist/NightCorpDisplay-Regular.otf + .woff2
// plus a font-test.html specimen page. Run: node build_font.cjs
//
// Metrics: unitsPerEm 1000, cap height 700 (design units x7), baseline y=0.
// Advance = cell + 18 (9 units side bearing each side); word space = 42 (+ bearings = 60 visual).
// Design y is top-down; font y is bottom-up: fy = (100 - y) * 7.
const fs = require('fs');
const path = require('path');
const opentype = require('opentype.js');
const { orient, GEO, PUNCT, CELLS } = require('./glyph-data.cjs');

const DIST = path.join(__dirname, '..', 'dist');
fs.mkdirSync(DIST, { recursive: true });
const K = 7, BEARING = 9;

// name -> [unicodes]; letters also map their lowercase codepoints (all-caps face)
const MAP = {};
for (const L of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') MAP[L] = [L.charCodeAt(0), L.toLowerCase().charCodeAt(0)];
for (const D of '0123456789') MAP[D] = [D.charCodeAt(0)];
Object.assign(MAP, {
  period: [46], comma: [44], colon: [58], semicolon: [59],
  hyphen: [45, 0x2010], exclamation: [33], question: [63],
  apostrophe: [39, 0x2019, 0x2018], backtick: [96], quote: [34, 0x201C, 0x201D],
  slash: [47], backslash: [92],
  'paren-left': [40], 'paren-right': [41], 'bracket-left': [91], 'bracket-right': [93],
  'brace-left': [123], 'brace-right': [125],
  plus: [43], equals: [61], times: [0x00D7], divide: [0x00F7],
  minus: [0x2212, 0x2013], asterisk: [42], pipe: [124], degree: [0x00B0], percent: [37],
  underscore: [95], 'chevron-left': [60], 'chevron-right': [62], bullet: [0x2022],
  euro: [0x20AC], dollar: [36], hash: [35], at: [64], ampersand: [38], tilde: [126, 0x2248],
  copyright: [0x00A9], registered: [0x00AE], 'sound-recording': [0x2117], trademark: [0x2122],
});
const PS_NAMES = {
  period: 'period', comma: 'comma', colon: 'colon', semicolon: 'semicolon', hyphen: 'hyphen',
  exclamation: 'exclam', question: 'question', apostrophe: 'quotesingle', backtick: 'grave',
  quote: 'quotedbl', slash: 'slash', backslash: 'backslash', 'paren-left': 'parenleft',
  'paren-right': 'parenright', 'bracket-left': 'bracketleft', 'bracket-right': 'bracketright',
  'brace-left': 'braceleft', 'brace-right': 'braceright', plus: 'plus', equals: 'equal',
  times: 'multiply', divide: 'divide', minus: 'minus', asterisk: 'asterisk', pipe: 'bar',
  degree: 'degree', percent: 'percent', underscore: 'underscore', 'chevron-left': 'less',
  'chevron-right': 'greater', bullet: 'bullet', euro: 'Euro', dollar: 'dollar', hash: 'numbersign',
  at: 'at', ampersand: 'ampersand', tilde: 'asciitilde', copyright: 'copyright',
  registered: 'registered', 'sound-recording': 'uni2117', trademark: 'trademark',
};

// Font outlines must be overlap-free (rasterisers and game-engine triangulators are far
// stricter than SVG's nonzero rule): union all solid pieces, subtract the counters.
const polygonClipping = require('polygon-clipping');
function flatten(shapes) {
  // painter's order: counters cut only what came before them, later solids paint back on top
  // (the corp-mark letters sit inside the ring's counter; a global subtract would erase them)
  let result = [];
  for (const s of shapes) {
    const poly = [[[...s.pts.map(p => [...p]), [...s.pts[0]]]]];
    result = s.counter ? polygonClipping.difference(result, ...poly) : polygonClipping.union(result, ...poly);
  }
  const rings = [];
  for (const poly of result) {
    poly.forEach((ring, i) => {
      const pts = ring.slice(0, -1); // drop the closing duplicate
      rings.push({ pts, counter: i > 0 });
    });
  }
  return rings;
}
function toPath(shapes) {
  const p = new opentype.Path();
  for (const { pts, counter } of flatten(shapes)) {
    // font outlines are y-up; flipping y reverses orientation, so request the opposite
    const o = orient(pts, counter);
    p.moveTo((o[0][0] + BEARING) * K, (100 - o[0][1]) * K);
    for (let i = 1; i < o.length; i++) p.lineTo((o[i][0] + BEARING) * K, (100 - o[i][1]) * K);
    p.close();
  }
  return p;
}

const glyphs = [
  new opentype.Glyph({ name: '.notdef', unicode: 0, advanceWidth: 650, path: new opentype.Path() }),
  new opentype.Glyph({ name: 'space', unicodes: [32, 0xA0], advanceWidth: 42 * K, path: new opentype.Path() }),
];
const ALL = { ...GEO, ...PUNCT };
for (const [name, shapes] of Object.entries(ALL)) {
  const unicodes = MAP[name];
  if (!unicodes) { console.warn('no unicode mapping for', name); continue; }
  glyphs.push(new opentype.Glyph({
    name: PS_NAMES[name] || name,
    unicode: unicodes[0], unicodes,
    advanceWidth: (CELLS[name] + 2 * BEARING) * K,
    path: toPath(shapes),
  }));
}

const font = new opentype.Font({
  familyName: 'Night Corp Display',
  styleName: 'Regular',
  unitsPerEm: 1000,
  ascender: 790,        // dollar stem tops out at 770
  descender: -130,      // comma tail bottoms at -84
  glyphs,
});
const META_NAMES = {
  copyright: { en: 'Copyright 2026 Adam Murphy. Unofficial Cyberpunk fan content per CD PROJEKT RED fan content guidelines; not affiliated with CD PROJEKT RED.' },
  license: { en: 'SIL Open Font License 1.1, Reserved Font Name "Night Corp Display"' },
  licenseURL: { en: 'https://openfontlicense.org' },
  designer: { en: 'Adam Murphy (spuddeh)' },
};
for (const plat of ['unicode', 'macintosh', 'windows']) {
  if (font.names[plat]) Object.assign(font.names[plat], META_NAMES);
}
const otf = Buffer.from(font.toArrayBuffer());
const otfPath = path.join(DIST, 'NightCorpDisplay-Regular.otf');
fs.writeFileSync(otfPath, otf);
console.log(`wrote ${otfPath} (${otf.length} bytes, ${glyphs.length} glyphs)`);

(async () => {
  const woff2 = require('wawoff2');
  const compressed = Buffer.from(await woff2.compress(otf));
  const woffPath = path.join(DIST, 'NightCorpDisplay-Regular.woff2');
  fs.writeFileSync(woffPath, compressed);
  console.log(`wrote ${woffPath} (${compressed.length} bytes)`);

  const test = `<!doctype html><meta charset="utf-8"><title>Night Corp Display: font test</title>
<style>
  @font-face { font-family: 'Night Corp Display'; src: url('NightCorpDisplay-Regular.woff2') format('woff2'), url('NightCorpDisplay-Regular.otf') format('opentype'); }
  body { background: #0a0e14; color: #eaf2ff; font-family: 'Night Corp Display'; margin: 48px; }
  p { margin: 0 0 22px; }
  .s72 { font-size: 72px; } .s48 { font-size: 48px; } .s34 { font-size: 34px; } .s28 { font-size: 28px; }
  .gold { color: #ffb300; } .cyan { color: #00f0ff; }
</style>
<p class="s72">NC ZONING ACADEMY</p>
<p class="s48 cyan">NIGHT CITY 2077</p>
<p class="s34">SYNTHWAVE // OUTRUN &bull; NC RADIO &bull; 101.9</p>
<p class="s34 gold">&euro;$ 12,500 | 360&deg; &divide; 8 = 45&deg;</p>
<p class="s28">&gt;_ ACCESS TERMINAL { GRANTED } ~ OK</p>
<p class="s28">ABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789</p>
<p class="s28">. , : ; - ! ? ' " / \\ ( ) [ ] { } + = &times; &divide; * | &deg; % _ &lt; &gt; # @ &amp; &copy; &reg; &#8471; &trade;</p>
<p class="s28">THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG &mdash; typed lowercase: the quick brown fox</p>`;
  fs.writeFileSync(path.join(DIST, 'font-test.html'), test.replace('&mdash; ', ''));
  console.log('wrote font-test.html');
})();
