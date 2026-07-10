import { renderCardSvg } from './card-svg.js';
import { renderDashboard } from './dashboard.js';
import { icon } from './icons.js';
import { FONT_FACE_CSS, NUM_FONT_FAMILY } from './font.js';

function esc(s) {
  return String(s).replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
}

const CSS = `
:root {
  --page: #0a0e18;
  --surface: #111828;
  --surface-2: #16203a;
  --ink: #f2f5fc;
  --ink-2: #c6cdde;
  --muted: #8b92a8;
  --hairline: rgba(255,255,255,0.09);
  --series: #3987e5;
  --series-bright: #4da3ff;
  --gold: #e8b64c;
  --cell-empty: rgba(255,255,255,0.07);
  --sp-2: 8px; --sp-3: 12px; --sp-4: 16px; --sp-6: 24px; --sp-8: 32px; --sp-12: 48px;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html { scrollbar-color: #2a3550 var(--page); }
body {
  background-color: var(--page);
  background-image: radial-gradient(1100px 520px at 50% -120px, #17203a, var(--page) 62%);
  background-repeat: no-repeat;
  color: var(--ink);
  font-family: system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Noto Sans JP', sans-serif;
  padding: var(--sp-8) var(--sp-4) 96px;
  line-height: 1.55;
}
.wrap { max-width: 1160px; margin: 0 auto; }
.num, .bar-value, .axis-score { font-variant-numeric: tabular-nums; }

/* ---- card zone ---- */
.card-holder { text-align: center; }
.card-frame {
  position: relative; display: inline-block; max-width: 100%;
  border-radius: 16px; overflow: hidden;
  box-shadow: 0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(244,210,122,0.14), 0 0 44px rgba(244,210,122,0.10);
}
.card-frame svg { display: block; max-width: 100%; height: auto; }
/* live holographic shimmer — sweeps across the card; NOT baked into the PNG
   export (that serializes only the inner <svg>). Pure eye-candy for viewing. */
.card-frame::before {
  content: ''; position: absolute; inset: 0; pointer-events: none;
  background: linear-gradient(115deg, transparent 30%,
    rgba(255,77,109,0.14), rgba(255,227,77,0.12), rgba(77,255,163,0.12),
    rgba(67,217,255,0.14), rgba(200,107,255,0.14), transparent 70%);
  background-size: 260% 260%;
  mix-blend-mode: color-dodge;
  animation: holo-sweep 7s ease-in-out infinite;
}
@keyframes holo-sweep {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@media (prefers-reduced-motion: reduce) { .card-frame::before { animation: none; } }
.card-actions { margin: var(--sp-6) 0 var(--sp-3); }
button.save-png {
  display: inline-flex; align-items: center; gap: 8px;
  background: linear-gradient(180deg, var(--series-bright), var(--series));
  color: #fff; border: 0; border-radius: 10px;
  padding: 12px 26px; font-size: 15px; font-weight: 700; cursor: pointer;
  font-family: inherit; transition: transform .12s ease, box-shadow .12s ease;
  box-shadow: 0 6px 20px rgba(57,135,229,0.35);
}
button.save-png:hover { transform: translateY(-1px); box-shadow: 0 10px 26px rgba(57,135,229,0.45); }
button.save-png svg { margin: 0; }
.local-note { color: var(--muted); font-size: 13px; display: flex; align-items: center; justify-content: center; gap: 6px; }
.share-note { margin-top: 4px; font-size: 12px; opacity: 0.85; }

/* ---- dashboard chrome ---- */
.privacy-banner {
  margin: var(--sp-12) 0 var(--sp-6); padding: 12px 16px; border-radius: 10px;
  display: flex; align-items: center; gap: 10px;
  background: rgba(232,182,76,0.07); border: 1px solid rgba(232,182,76,0.22);
  color: rgba(232,182,76,0.92); font-size: 13px; line-height: 1.6;
}
.privacy-banner svg { flex: none; }
section { margin-top: var(--sp-12); }
h2 {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase;
  color: var(--muted); margin-bottom: var(--sp-4);
}
h2 svg { color: var(--series-bright); }
h2::after { content: ''; flex: 1; height: 1px; background: linear-gradient(90deg, var(--hairline), transparent); margin-left: 8px; }
.panel {
  background: linear-gradient(180deg, var(--surface-2), var(--surface));
  border: 1px solid var(--hairline); border-radius: 14px; padding: var(--sp-6);
}

/* ---- scoring method ---- */
.score-panel { padding: var(--sp-6); }
.score-intro { color: var(--ink-2); font-size: 14px; margin-bottom: var(--sp-6); max-width: 78ch; }
.score-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(440px, 1fr)); gap: var(--sp-4); }
.score-step {
  background: rgba(255,255,255,0.025); border: 1px solid var(--hairline);
  border-radius: 12px; padding: var(--sp-4);
}
.score-step h4 { font-size: 13.5px; color: var(--ink); margin-bottom: 10px; font-weight: 700; }
.formula {
  font-family: 'SFMono-Regular', ui-monospace, 'Cascadia Code', Menlo, monospace;
  font-size: 15px; color: var(--gold); background: rgba(232,182,76,0.06);
  border: 1px solid rgba(232,182,76,0.18); border-radius: 8px;
  padding: 10px 12px; margin-bottom: 10px; overflow-x: auto;
}
.formula .v { color: var(--series-bright); font-style: italic; }
.formula sup { font-size: 0.7em; }
.score-step p { font-size: 12.5px; color: var(--muted); line-height: 1.6; }
.rarity-block { margin-top: var(--sp-6); padding-top: var(--sp-6); border-top: 1px solid var(--hairline); }
.rarity-block h4 { font-size: 13.5px; color: var(--ink); margin-bottom: 8px; }
.rarity-block > p { font-size: 12.5px; color: var(--muted); margin-bottom: var(--sp-4); max-width: 78ch; }
.rarity-table { width: 100%; max-width: 460px; border-collapse: collapse; font-size: 13.5px; }
.rarity-table th { color: var(--muted); font-weight: 600; text-align: left; padding: 5px 8px; border-bottom: 1px solid var(--hairline); font-size: 11.5px; letter-spacing: 0.6px; }
.rarity-table td { padding: 7px 8px; border-bottom: 1px solid rgba(255,255,255,0.045); }
.rarity-table tbody tr:last-child td { border-bottom: 0; }
.rarity-table .tier { color: var(--gold); font-weight: 800; letter-spacing: 0.5px; }
.rarity-table .stars { color: var(--gold); letter-spacing: 2px; }
.rarity-table .dim { color: rgba(255,255,255,0.22); }
.rarity-table td.num { text-align: right; color: var(--ink-2); font-variant-numeric: tabular-nums; }

/* ---- axis breakdown ---- */
.axis-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(420px, 1fr)); gap: var(--sp-4); }
.axis-table {
  background: linear-gradient(180deg, var(--surface-2), var(--surface));
  border: 1px solid var(--hairline); border-radius: 14px; padding: var(--sp-6);
}
.axis-table h3 { font-size: 15px; display: flex; justify-content: space-between; align-items: baseline; }
.axis-score { color: var(--series-bright); font-weight: 800; font-size: 22px; font-family: ${NUM_FONT_FAMILY}; }
.axis-bar { height: 4px; border-radius: 2px; background: rgba(255,255,255,0.07); margin: 10px 0 14px; overflow: hidden; }
.axis-bar span { display: block; height: 100%; border-radius: 2px; background: linear-gradient(90deg, var(--series), var(--series-bright)); }
table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
th { color: var(--muted); font-weight: 600; text-align: left; padding: 4px 6px; border-bottom: 1px solid var(--hairline); font-size: 11.5px; letter-spacing: 0.6px; }
th:first-child, td:first-child { width: 36%; }
td.num, th.num { white-space: nowrap; }
td { padding: 6px; border-bottom: 1px solid rgba(255,255,255,0.045); color: var(--ink-2); }
tbody tr:last-child td { border-bottom: 0; }
.num { text-align: right; }
td.dim { color: var(--muted); }
td.strong { color: var(--ink); font-weight: 700; white-space: nowrap; }
.mini-track {
  display: inline-block; vertical-align: 2px; width: 44px; height: 4px; margin-right: 8px;
  border-radius: 2px; background: rgba(255,255,255,0.08); overflow: hidden;
}
.mini-track span { display: block; height: 100%; background: var(--series-bright); border-radius: 2px; }

/* ---- heatmap ---- */
.hm-wrap { display: flex; gap: 8px; justify-content: center; }
.hm-dow {
  display: flex; flex-direction: column; gap: 24px;
  padding-top: 41px; font-size: 11px; line-height: 16px; color: var(--muted); flex: none;
}
.hm-scroll { overflow-x: auto; padding-bottom: 4px; }
.hm-months { display: grid; gap: 3px; font-size: 11px; color: var(--muted); height: 18px; margin-bottom: 3px; }
.hm-months span { white-space: nowrap; }
.hm-grid { display: flex; gap: 3px; }
.hm-col { display: flex; flex-direction: column; gap: 3px; }
.hm-cell { width: 17px; height: 17px; border-radius: 3px; background: var(--cell-empty); }
.hm-legend { display: flex; align-items: center; gap: 4px; justify-content: flex-end; margin-top: 12px; font-size: 11px; color: var(--muted); }
.hm-legend i { width: 11px; height: 11px; border-radius: 3px; display: inline-block; }

/* ---- ranked bars ---- */
.bar-row { display: grid; grid-template-columns: 26px 240px 1fr 84px; gap: 12px; align-items: center; padding: 6px 0; }
.bar-row + .bar-row { border-top: 1px solid rgba(255,255,255,0.04); }
.bar-rank { font-size: 12px; color: var(--muted); text-align: right; font-variant-numeric: tabular-nums; }
.bar-label { font-size: 13px; color: var(--ink-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.bar-track { height: 12px; background: rgba(255,255,255,0.04); border-radius: 3px; }
.bar-fill { height: 100%; background: linear-gradient(90deg, var(--series), var(--series-bright)); border-radius: 3px; min-width: 2px; }
.bar-value { font-size: 13px; text-align: right; color: var(--ink); }

footer { margin-top: 72px; text-align: center; color: var(--muted); font-size: 13px; }
footer a { color: var(--series-bright); }

@media (max-width: 640px) {
  body { padding: var(--sp-4) var(--sp-3) 64px; }
  .bar-row { grid-template-columns: 20px minmax(90px, 130px) 1fr 64px; gap: 8px; }
  .axis-grid { grid-template-columns: 1fr; }
  .panel, .axis-table { padding: var(--sp-4); }
}
`;

const PNG_SCRIPT = `
document.getElementById('save-png').addEventListener('click', async () => {
  // Wait for the embedded Orbitron face so numerals rasterize correctly.
  if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch (e) {} }
  const svg = document.getElementById('card-svg');
  const xml = new XMLSerializer().serializeToString(svg);
  const url = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml;charset=utf-8' }));
  const img = new Image();
  img.onload = () => {
    const scale = 2; // retina export
    const c = document.createElement('canvas');
    c.width = svg.width.baseVal.value * scale;
    c.height = svg.height.baseVal.value * scale;
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    const a = document.createElement('a');
    a.download = 'cc-mastery-card.png';
    a.href = c.toDataURL('image/png');
    a.click();
    URL.revokeObjectURL(url);
  };
  img.src = url;
});
`;

/**
 * Assemble the single self-contained HTML report.
 * data = { score, title, stats, sessions, lang, t, generatedAt, version }
 */
export function renderHtml(data) {
  const { t, lang } = data;
  const card = renderCardSvg(data);
  const dashboard = renderDashboard(data);
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>cc-mastery</title>
<style>${FONT_FACE_CSS}${CSS}</style>
</head>
<body>
<div class="wrap">
  <div class="card-holder">
    <div class="card-frame">${card}</div>
    <div class="card-actions">
      <button class="save-png" id="save-png">${icon('download', 16)}${esc(t('savePng'))}</button>
    </div>
    <div class="local-note">${icon('lock', 13)}${esc(t('localOnly'))}</div>
    <div class="local-note share-note">${esc(t('shareNote'))}</div>
  </div>
  ${dashboard}
  <footer>${esc(t('generatedBy'))} <a href="https://github.com/hiroooo/cc-mastery">cc-mastery</a> v${esc(data.version)}</footer>
</div>
<script>${PNG_SCRIPT}</script>
</body>
</html>`;
}
