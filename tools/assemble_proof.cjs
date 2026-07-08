// NC Type proof sheet builder. Reads ../svg (current set), ../svg-original-trace (pre-remaster),
// and the logo v2/v3 files; writes ../proof.html. Pass an extra output path to also write there.
const fs = require('fs');
const path = require('path');
const SVG_DIR = path.join(__dirname, '..', 'svg');
const TRACE_DIR = path.join(__dirname, '..', 'svg-original-trace');
const SOURCE_DIR = path.join(__dirname, '..', 'source');
const DIST_DIR = path.join(__dirname, '..', 'dist');
const OUT = path.join(__dirname, '..', 'proof.html');
const EXTRA_OUT = process.argv[2] || null;

const CANON = new Set(['C', 'G', 'H', 'I', 'N', 'O', 'P', 'R', 'T']);
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const DIGITS = '0123456789'.split('');
const PUNCT = ['period','comma','colon','semicolon','hyphen','exclamation','question','apostrophe','quote','slash','backslash','paren-left','paren-right','bracket-left','bracket-right','plus','equals','times','percent','underscore','chevron-left','chevron-right','bullet','euro','dollar','hash','brace-left','brace-right','at','ampersand','tilde','divide','minus','asterisk','pipe','degree','backtick','copyright','registered','sound-recording','trademark'];
const PUNCT_LABEL = { period: '.', comma: ',', colon: ':', semicolon: ';', hyphen: '-', exclamation: '!', question: '?', apostrophe: "'", quote: '"', slash: '/', backslash: '\\\\', 'paren-left': '(', 'paren-right': ')', 'bracket-left': '[', 'bracket-right': ']', plus: '+', equals: '=', times: '×', percent: '%', underscore: '_', 'chevron-left': '<', 'chevron-right': '>', bullet: '•', euro: '€', dollar: '$', hash: '#', 'brace-left': '{', 'brace-right': '}', at: '@', ampersand: '&', tilde: '~', divide: '÷', minus: '−', asterisk: '*', pipe: '|', degree: '°', backtick: '`', copyright: '©', registered: '®', 'sound-recording': '℗', trademark: '™' };
const CHAR_TO_GLYPH = { '.': 'period', ',': 'comma', ':': 'colon', ';': 'semicolon', '-': 'hyphen', '!': 'exclamation', '?': 'question', "'": 'apostrophe', '"': 'quote', '/': 'slash', '\\': 'backslash', '(': 'paren-left', ')': 'paren-right', '[': 'bracket-left', ']': 'bracket-right', '+': 'plus', '=': 'equals', '×': 'times', '%': 'percent', '_': 'underscore', '<': 'chevron-left', '>': 'chevron-right', '•': 'bullet', '€': 'euro', '$': 'dollar', '#': 'hash', '{': 'brace-left', '}': 'brace-right', '@': 'at', '&': 'ampersand', '~': 'tilde', '÷': 'divide', '−': 'minus', '*': 'asterisk', '|': 'pipe', '°': 'degree', '`': 'backtick', '©': 'copyright', '®': 'registered', '℗': 'sound-recording', '™': 'trademark' };

function parsePath(d) {
  const tokens = d.match(/[MmLlZz]|-?\d*\.?\d+/g);
  let i = 0, cx = 0, cy = 0, cmd = null;
  const subpaths = [];
  let cur = null;
  while (i < tokens.length) {
    const t = tokens[i];
    if (/[MmLlZz]/.test(t)) { cmd = t; i++; if (/[Zz]/.test(t)) cmd = null; continue; }
    const x = parseFloat(tokens[i]), y = parseFloat(tokens[i + 1]); i += 2;
    if (cmd === 'M') { cx = x; cy = y; cur = [[cx, cy]]; subpaths.push(cur); cmd = 'L'; }
    else if (cmd === 'm') { cx += x; cy += y; cur = [[cx, cy]]; subpaths.push(cur); cmd = 'l'; }
    else if (cmd === 'L') { cx = x; cy = y; cur.push([cx, cy]); }
    else if (cmd === 'l') { cx += x; cy += y; cur.push([cx, cy]); }
  }
  return subpaths;
}
const bboxOf = sps => {
  const pts = sps.flat();
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
};
function glyphData(dir, name) {
  const svg = fs.readFileSync(path.join(dir, name + '.svg'), 'utf8');
  const d = svg.match(/<path d="([^"]+)"/)[1];
  const bb = bboxOf(parsePath(d));
  return { d, bb, w: bb.x1 - bb.x0, h: bb.y1 - bb.y0 };
}
const glyphs = {}, traceGlyphs = {};
for (const L of [...LETTERS, ...DIGITS, ...PUNCT]) glyphs[L] = glyphData(SVG_DIR, L);
for (const L of LETTERS) traceGlyphs[L] = glyphData(TRACE_DIR, L);

function glyphSVG(g, { size = 96, fill = '#eaf2ff' } = {}) {
  const pad = 8;
  const vb = `${g.bb.x0 - pad} ${g.bb.y0 - pad} ${g.w + pad * 2} ${g.h + pad * 2}`;
  return `<svg viewBox="${vb}" width="${Math.max(24, size * (g.w + pad * 2) / (g.h + pad * 2)).toFixed(0)}" height="${size}" role="img"><path d="${g.d}" fill="${fill}" fill-rule="nonzero"/></svg>`;
}
function overlaySVG(letter) {
  const t = traceGlyphs[letter], r = glyphs[letter];
  const pad = 8;
  const sx = t.w / r.w, sy = t.h / r.h;
  const vb = `${t.bb.x0 - pad} ${t.bb.y0 - pad} ${t.w + pad * 2} ${t.h + pad * 2}`;
  const size = 150;
  return `<svg viewBox="${vb}" width="${(size * (t.w + pad * 2) / (t.h + pad * 2)).toFixed(0)}" height="${size}" role="img">
    <path d="${t.d}" fill="#eaf2ff" fill-rule="nonzero" opacity="0.92"/>
    <g transform="translate(${t.bb.x0} ${t.bb.y0}) scale(${sx.toFixed(4)} ${sy.toFixed(4)}) translate(${-r.bb.x0} ${-r.bb.y0})">
      <path d="${r.d}" fill="none" stroke="#00f0ff" stroke-width="${(2.2 / Math.max(sx, sy)).toFixed(2)}" fill-rule="nonzero"/>
    </g>
  </svg>`;
}
// monogram overlay: v2 trace vs v3 remaster (subpaths above the wordmark band)
function monogramOverlay() {
  const get = file => {
    const svg = fs.readFileSync(path.join(file.includes('_v2') ? SOURCE_DIR : DIST_DIR, file), 'utf8');
    const sps = parsePath(svg.match(/ d="([^"]+)"/)[1]).filter(sp => Math.min(...sp.map(p => p[1])) < 85);
    const d = sps.map(sp => 'M' + sp.map(p => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(' L') + ' Z').join(' ');
    return { d, bb: bboxOf(sps) };
  };
  const t = get('nightcorp_logo_v2.svg'), r = get('nightcorp_logo_v3.svg');
  const pad = 3, w = t.bb.x1 - t.bb.x0, h = t.bb.y1 - t.bb.y0;
  const size = 300;
  return `<svg viewBox="${t.bb.x0 - pad} ${t.bb.y0 - pad} ${w + pad * 2} ${h + pad * 2}" width="${(size * (w + pad * 2) / (h + pad * 2)).toFixed(0)}" height="${size}" role="img">
    <path d="${t.d}" fill="#eaf2ff" fill-rule="nonzero" opacity="0.92"/>
    <path d="${r.d}" fill="none" stroke="#00f0ff" stroke-width="0.6" fill-rule="nonzero"/>
  </svg>`;
}
function specimen(text, size = 44) {
  const GAP = 18, SPACE = 60;
  let x = 0; const parts = [];
  for (const ch of text) {
    if (ch === ' ') { x += SPACE; continue; }
    const g = glyphs[ch] || glyphs[CHAR_TO_GLYPH[ch]];
    if (!g) continue;
    parts.push(`<g transform="translate(${(x - g.bb.x0).toFixed(1)} 0)"><path d="${g.d}" fill="#eaf2ff" fill-rule="nonzero"/></g>`);
    x += g.w + GAP;
  }
  const totalW = x - GAP;
  return `<svg viewBox="-2 -12 ${(totalW + 4).toFixed(0)} 128" width="${(size * totalW / 114).toFixed(0)}" height="${size}" role="img" aria-label="${text.replace(/"/g, '&quot;')}">${parts.join('')}</svg>`;
}
function logoSVG(file, { width = 460, crop = null } = {}) {
  let svg = fs.readFileSync(path.join(file.includes('_v2') ? SOURCE_DIR : DIST_DIR, file), 'utf8');
  svg = svg.replace(/fill="#000000"/g, 'fill="#eaf2ff"');
  if (crop) svg = svg.replace(/viewBox="[^"]+"/, `viewBox="${crop}"`);
  svg = svg.replace(/width="[^"]+" height="[^"]+"/, '');
  const vb = svg.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number);
  svg = svg.replace('<svg ', `<svg width="${width}" height="${(width * vb[3] / vb[2]).toFixed(0)}" `);
  return svg;
}

const cardRow = (names, labeler) => names.map(n => `<div class="cell">
    <div class="cell-head"><span class="cell-letter">${labeler(n)}</span></div>
    <div class="cell-glyph">${glyphSVG(glyphs[n], { size: 84 })}</div>
    <div class="cell-w mono">w ${glyphs[n].w.toFixed(0)}</div>
  </div>`).join('\n');

const gridCards = LETTERS.map(L => `<div class="cell">
    <div class="cell-head"><span class="cell-letter">${L}</span><span class="badge ${CANON.has(L) ? 'badge-gold' : 'badge-cyan'}">${CANON.has(L) ? 'CANONICAL' : 'REBUILT'}</span></div>
    <div class="cell-glyph">${glyphSVG(glyphs[L], { size: 92 })}</div>
    <div class="cell-w mono">w ${glyphs[L].w.toFixed(0)}</div>
  </div>`).join('\n');

const overlays = 'NIGHTCORP'.split('').filter((c, i, a) => a.indexOf(c) === i).map(L => `<figure class="fit">
    ${overlaySVG(L)}
    <figcaption><strong>${L}</strong></figcaption>
  </figure>`).join('\n');

const html = `<title>NC Font Glyphs: Proof Sheet</title>
<meta name="color-scheme" content="dark">
<style>
  :root {
    --bg: #0a0e14; --panel: #111826; --panel-2: #0d131d; --line: rgba(234,242,255,0.08);
    --ink: #eaf2ff; --muted: #8892b0; --cyan: #00f0ff; --gold: #ffb300;
    --mono: Consolas, "Cascadia Mono", ui-monospace, monospace;
  }
  html { background: var(--bg); }
  body { background: var(--bg); color: var(--ink); font: 15px/1.55 "Segoe UI", system-ui, sans-serif; margin: 0; padding: 40px 32px 80px; }
  .wrap { max-width: 1180px; margin: 0 auto; }
  .mono { font-family: var(--mono); font-variant-numeric: tabular-nums; }
  h1 { font-size: 26px; letter-spacing: 0.04em; margin: 0 0 4px; text-wrap: balance; }
  .sub { color: var(--muted); margin: 0 0 28px; max-width: 74ch; }
  .eyebrow { color: var(--cyan); font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase; margin: 44px 0 6px; }
  h2 { font-size: 19px; margin: 0 0 6px; }
  .lede { color: var(--muted); margin: 0 0 18px; max-width: 78ch; }
  .constants { display: flex; flex-wrap: wrap; gap: 10px; margin: 18px 0 6px; }
  .const { background: var(--panel); border: 1px solid var(--line); border-radius: 6px; padding: 10px 14px; }
  .const b { display: block; font-size: 18px; font-family: var(--mono); font-weight: 600; color: var(--cyan); }
  .const span { font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); }
  .fits { display: flex; flex-wrap: wrap; gap: 14px; align-items: flex-end; }
  .fit { margin: 0; background: var(--panel); border: 1px solid var(--line); border-radius: 6px; padding: 14px 14px 8px; }
  .fit figcaption { text-align: center; color: var(--muted); padding-top: 6px; font-size: 13px; }
  .legend { display: flex; gap: 18px; color: var(--muted); font-size: 13px; margin: 10px 0 16px; }
  .legend i { display: inline-block; width: 12px; height: 12px; border-radius: 2px; margin-right: 6px; vertical-align: -1px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; }
  .grid-sm { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 12px; }
  .cell { background: var(--panel); border: 1px solid var(--line); border-radius: 6px; padding: 10px 12px 8px; }
  .cell-head { display: flex; justify-content: space-between; align-items: center; gap: 6px; }
  .cell-letter { font-family: var(--mono); font-weight: 700; font-size: 15px; color: var(--muted); }
  .badge { font-size: 9px; letter-spacing: 0.12em; padding: 2px 7px; border-radius: 999px; border: 1px solid; white-space: nowrap; }
  .badge-gold { color: var(--gold); border-color: color-mix(in srgb, var(--gold) 45%, transparent); }
  .badge-cyan { color: var(--cyan); border-color: color-mix(in srgb, var(--cyan) 40%, transparent); }
  .cell-glyph { display: flex; justify-content: center; padding: 12px 0 6px; min-height: 92px; align-items: center; }
  .cell-w { color: var(--muted); font-size: 11px; text-align: right; }
  .logo-pair { display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 12px; }
  .logo-card { background: var(--panel); border: 1px solid var(--line); border-radius: 6px; padding: 18px; }
  .logo-card h3 { font-size: 13px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); margin: 0 0 12px; }
  .logo-card .zoom { margin-top: 10px; border-top: 1px solid var(--line); padding-top: 10px; overflow-x: auto; }
  .mono-fit { background: var(--panel); border: 1px solid var(--line); border-radius: 6px; padding: 18px; display: inline-block; }
  .spec { background: var(--panel-2); border: 1px solid var(--line); border-radius: 6px; padding: 22px 20px; overflow-x: auto; margin-bottom: 12px; }
  ul.notes { color: var(--muted); max-width: 82ch; padding-left: 18px; }
  ul.notes li { margin-bottom: 8px; }
  ul.notes b { color: var(--ink); }
</style>
<div class="wrap">
  <h1>NC Font Glyphs: Proof Sheet</h1>
  <p class="sub">Rev 3, 2026-07-08. Letters A to Z (canonical nine remastered), digits 0 to 9, core punctuation, and the monogram remastered on its own system. Regenerate with tools/generate_glyphs.cjs then tools/assemble_proof.cjs.</p>

  <p class="eyebrow">Measured system</p>
  <div class="constants">
    <div class="const"><b>26</b><span>vertical stem</span></div>
    <div class="const"><b>17</b><span>horizontal bar</span></div>
    <div class="const"><b>20×14</b><span>chamfer (≈35°)</span></div>
    <div class="const"><b>17⊥</b><span>diagonal weight</span></div>
    <div class="const"><b>y40..57</b><span>mid band</span></div>
    <div class="const"><b>149 / 134 / 110 / 26</b><span>cells (wide / narrow / digit / I)</span></div>
    <div class="const"><b>18</b><span>letter gap</span></div>
  </div>
  <p class="lede">Two systems, both canonical: the <em>type</em> runs 26/17 strokes with 20×14 chamfers on bends; the <em>monogram</em> runs uniform 22.5 strokes with everything at 45°, which is also the system the favicon Z was designed to suit.</p>

  <p class="eyebrow">Monogram</p>
  <h2>Monogram remaster, same process as the letters</h2>
  <p class="lede">The bmp trace (solid) with the pure rebuild over it (cyan outline). Uniform 22.5-unit strokes, the N diagonal at exactly 45° with a 37-unit horizontal cross-section, the slash bar a 45°-cut parallelogram. Now baked into logo v3 alongside the pure lettering.</p>
  <div class="mono-fit">${monogramOverlay()}</div>

  <p class="eyebrow">Remaster fit</p>
  <h2>Wordmark trace (solid) vs the rule-built remaster (cyan outline)</h2>
  <div class="legend"><span><i style="background:#eaf2ff"></i>original bmp trace</span><span><i style="border:2px solid var(--cyan)"></i>remaster (now canonical)</span></div>
  <div class="fits">
${overlays}
  </div>

  <p class="eyebrow">Logo</p>
  <h2>Logo v3: fully pure geometry</h2>
  <div class="logo-pair">
    <div class="logo-card"><h3>v2, bmp trace (immutable reference)</h3>${logoSVG('nightcorp_logo_v2.svg')}<div class="zoom">${logoSVG('nightcorp_logo_v2.svg', { width: 900, crop: '0 86 154.55 14' })}</div></div>
    <div class="logo-card"><h3>v3, remastered monogram + lettering</h3>${logoSVG('nightcorp_logo_v3.svg')}<div class="zoom">${logoSVG('nightcorp_logo_v3.svg', { width: 900, crop: '0 86 154.55 14' })}</div></div>
  </div>

  <p class="eyebrow">Full set</p>
  <h2>A to Z</h2>
  <div class="grid">
${gridCards}
  </div>

  <p class="eyebrow">Digits</p>
  <h2>0 to 9, tabular on a 110 cell</h2>
  <p class="lede">Lining digits, one shared advance so coordinates and codes column-align. 0 chamfers only the Z pair (top-left, bottom-right) to separate from O; 4 stays rectilinear with the G-spur arm; 7 is Z without the bottom bar; 8 is B without the stem.</p>
  <div class="grid-sm">
${cardRow(DIGITS, n => n)}
  </div>

  <p class="eyebrow">Punctuation</p>
  <h2>Core marks</h2>
  <p class="lede">Dots are 20×17 blocks; the comma and semicolon tails are the only strokes allowed below the baseline. Slashes carry the Z diagonal at 17 perpendicular. Parens chamfer their outer bends; brackets stay square. The percent rings are the one deliberate off-system reduction. Tier 0 site additions: underscore and chevrons (the terminal prompt), bullet (station IDs), and the eddies pair (the euro is a C-frame with two square-junction crossbars; the dollar runs its stem through the S counters to stay inside the cell).</p>
  <div class="grid-sm">
${cardRow(PUNCT, n => PUNCT_LABEL[n])}
  </div>

  <p class="eyebrow">Specimens</p>
  <h2>Letters, digits and marks together</h2>
  <div class="spec">${specimen('NC ZONING BOARD')}</div>
  <div class="spec">${specimen('NIGHT CITY ACADEMY 2077', 38)}</div>
  <div class="spec">${specimen('0123456789', 38)}</div>
  <div class="spec">${specimen('LEVEL 3-B, NO. 7?', 34)}</div>
  <div class="spec">${specimen('ZONE 04: 100% "PURE" (V3)', 30)}</div>
  <div class="spec">${specimen('NC RADIO • 101.9', 34)}</div>
  <div class="spec">${specimen('SYNTHWAVE // OUTRUN', 34)}</div>
  <div class="spec">${specimen('>_ ACCESS TERMINAL', 34)}</div>
  <div class="spec">${specimen('€$ 12,500', 34)}</div>
  <div class="spec">${specimen('NIGHT CORP © ® ℗ ™ 2077', 30)}</div>
  <div class="spec">${specimen('@NCZONING #04 { OK } & CO', 30)}</div>
  <div class="spec">${specimen('360° ÷ 8 = 45° | YAW ~ −180.0°', 30)}</div>
  <div class="spec">${specimen('THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG', 24)}</div>

  <p class="eyebrow">Notes</p>
  <ul class="notes">
    
    <li><b>Original traces</b> are preserved in svg-original-trace/ beside the font files; logo v2 remains the immutable reference.</li>
    <li><b>Corp marks:</b> the enclosed © ® ℗ rings hold literal scaled instances of the family C, R and P; ™ is scaled T and M. Nothing remains deferred; the extended set is complete.</li>
  </ul>
</div>`;

fs.writeFileSync(OUT, html);
if (EXTRA_OUT) fs.writeFileSync(EXTRA_OUT, html);
console.log('wrote', OUT, html.length, 'bytes', EXTRA_OUT ? `(+ ${EXTRA_OUT})` : '');

// ---- GitHub Pages variant: live type tester + downloads + the proof below ----
const DOCS_DIR = path.join(__dirname, '..', 'docs');
fs.mkdirSync(DOCS_DIR, { recursive: true });
for (const f of ['NightCorpDisplay-Regular.woff2', 'NightCorpDisplay-Regular.otf']) {
  const src = path.join(DIST_DIR, f);
  if (fs.existsSync(src)) fs.copyFileSync(src, path.join(DOCS_DIR, f));
  else console.warn('pages: missing', f, '- run build_font.cjs first');
}
const pagesCss = `
  @font-face { font-family: 'Night Corp Display'; src: url('NightCorpDisplay-Regular.woff2') format('woff2'), url('NightCorpDisplay-Regular.otf') format('opentype'); }
  .live-title { font-family: 'Night Corp Display'; font-size: clamp(34px, 6vw, 72px); margin: 0 0 4px; color: var(--ink); font-weight: 400; }
  .tester { font-family: 'Night Corp Display'; background: var(--panel-2); border: 1px dashed color-mix(in srgb, var(--cyan) 45%, transparent); border-radius: 6px; padding: 20px; margin: 0 0 12px; outline: none; overflow-x: auto; white-space: nowrap; }
  .tester:focus { border-style: solid; }
  .dl { display: flex; gap: 10px; flex-wrap: wrap; margin: 14px 0 4px; }
  .dl a { color: var(--cyan); border: 1px solid color-mix(in srgb, var(--cyan) 40%, transparent); border-radius: 6px; padding: 8px 14px; text-decoration: none; font-size: 13px; letter-spacing: 0.08em; }
  .live-specs { margin-top: 8px; }
  .live-specs p { font-family: 'Night Corp Display'; margin: 0 0 26px; }
  .c-cyan { color: var(--cyan); } .c-gold { color: var(--gold); } .c-gray { color: var(--muted); }
  .foot { color: var(--muted); font-size: 13px; border-top: 1px solid var(--line); margin-top: 48px; padding-top: 18px; max-width: 82ch; }
  .foot a { color: var(--cyan); }
`;
const tester = `
  <p class="live-title">NIGHT CORP DISPLAY</p>
  <p class="sub">The compiled font, live on this page. Edit the samples below; download and licence links at the foot. Full proof sheet follows.</p>
  <p class="eyebrow">Live font</p>
  <h2>Type with it</h2>
  <div class="tester" contenteditable="true" spellcheck="false" style="font-size:56px">NIGHT CITY LEGEND 2077</div>
  <div class="tester" contenteditable="true" spellcheck="false" style="font-size:30px">360° ÷ 8 = 45° | €$ 12,500 &gt;_ ~ OK</div>
  <div class="dl">
    <a href="NightCorpDisplay-Regular.woff2" download>Download WOFF2</a>
    <a href="NightCorpDisplay-Regular.otf" download>Download OTF</a>
    <a href="https://github.com/spuddeh/nc-type-foundry">Repository</a>
  </div>
`;
const footer = `
  <div class="foot">
    <p><strong>Licence:</strong> the typeface is released under the SIL Open Font License 1.1 (Reserved Font Name "Night Corp Display"); the tooling is MIT. See the repository's LICENSE.md.</p>
    <p><strong>Fan content:</strong> unofficial fan content made under CD PROJEKT RED's <a href="https://www.cdprojektred.com/en/fan-content">Fan Content Guidelines</a>; not affiliated with, endorsed by, or sponsored by CD PROJEKT RED. Cyberpunk, Cyberpunk 2077 and related marks are trademarks of CD PROJEKT S.A.</p>
  </div>
`;
let pages = html.replace('</style>', pagesCss + '</style>');
pages = pages.replace('<h1>NC Font Glyphs: Proof Sheet</h1>', tester + '<h1>NC Font Glyphs: Proof Sheet</h1>');
const liveSpecs = `<p class="eyebrow">Specimens</p>
  <h2>Letters, digits and marks, set live in the font</h2>
  <div class="live-specs">
    <p style="font-size:64px">NC ZONING BOARD</p>
    <p style="font-size:44px" class="c-cyan">NIGHT CITY ACADEMY 2077</p>
    <p style="font-size:36px">SYNTHWAVE // OUTRUN • NC RADIO • 101.9</p>
    <p style="font-size:36px" class="c-gold">€$ 12,500 | 360° ÷ 8 = 45°</p>
    <p style="font-size:30px">&gt;_ ACCESS TERMINAL { GRANTED } ~ OK</p>
    <p style="font-size:30px">ABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789</p>
    <p style="font-size:26px">. , : ; - ! ? ' " / \ ( ) [ ] { } + = × ÷ * | ° % _ &lt; &gt; # @ &amp; © ® ℗ ™</p>
    <p style="font-size:26px" class="c-gray">THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG</p>
  </div>

  `;
pages = pages.replace(/<p class="eyebrow">Specimens<\/p>[\s\S]*?(?=<p class="eyebrow">Notes<\/p>)/, liveSpecs);
pages = pages.replace(/<\/div>\s*$/, footer + '</div>');
pages = '<title>Night Corp Display</title>' + pages.replace('<title>NC Font Glyphs: Proof Sheet</title>', '');
fs.writeFileSync(path.join(DOCS_DIR, 'index.html'), pages);
console.log('wrote docs/index.html', pages.length, 'bytes');
