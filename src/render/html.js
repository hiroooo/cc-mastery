import { renderCardSvg } from './card-svg.js';
import { renderDashboard } from './dashboard.js';
import { icon } from './icons.js';

function esc(s) {
  return String(s).replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
}

const CSS = `
:root {
  --page: #0a0e18;
  --surface: #111726;
  --ink: #ffffff;
  --ink-2: #c3c2b7;
  --muted: #8b8fa3;
  --hairline: rgba(255,255,255,0.10);
  --series: #3987e5;
  --series-bright: #4da3ff;
  --gold: #e8b64c;
  --cell-empty: rgba(255,255,255,0.05);
}
h2 svg, .privacy-banner svg, .local-note svg, button svg { vertical-align: -3px; margin-right: 4px; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  background: var(--page);
  color: var(--ink);
  font-family: system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Noto Sans JP', sans-serif;
  padding: 32px 16px 80px;
}
.wrap { max-width: 1240px; margin: 0 auto; }
.card-holder { text-align: center; }
.card-holder svg { max-width: 100%; height: auto; border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.5); }
.card-actions { margin: 20px 0 12px; }
button.save-png {
  background: var(--series); color: #fff; border: 0; border-radius: 10px;
  padding: 12px 28px; font-size: 16px; font-weight: 700; cursor: pointer;
  font-family: inherit;
}
button.save-png:hover { filter: brightness(1.1); }
.local-note { color: var(--muted); font-size: 13px; margin-top: 10px; }
.privacy-banner {
  margin: 56px 0 8px; padding: 14px 18px; border-radius: 10px;
  background: rgba(232,182,76,0.10); border: 1px solid rgba(232,182,76,0.35);
  color: var(--gold); font-size: 14px; line-height: 1.6;
}
.dash-title { font-size: 24px; margin: 24px 0 8px; }
section { margin-top: 36px; }
h2 { font-size: 18px; color: var(--ink-2); margin-bottom: 16px; font-weight: 700; }
.axis-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 20px; }
.axis-table { background: var(--surface); border: 1px solid var(--hairline); border-radius: 12px; padding: 21px; }
.axis-table h3 { font-size: 16px; margin-bottom: 12px; display: flex; justify-content: space-between; }
.axis-score { color: var(--series); font-weight: 800; }
table { width: 100%; border-collapse: collapse; font-size: 14px; }
th { color: #aeb6c7; font-weight: 700; text-align: left; padding: 4px 6px; border-bottom: 1px solid var(--hairline); font-size: 13px; }
td { padding: 5px 6px; border-bottom: 1px solid rgba(255,255,255,0.04); color: #d6deea; }
.num { text-align: right; font-variant-numeric: tabular-nums; }
td.strong { color: var(--series-bright); font-weight: 700; }
.hm-scroll { overflow-x: auto; padding-bottom: 8px; }
.hm-grid { display: flex; gap: 3px; }
.hm-col { display: flex; flex-direction: column; gap: 3px; }
.hm-cell { width: 12px; height: 12px; border-radius: 3px; background: var(--cell-empty); }
.bars { background: var(--surface); border: 1px solid var(--hairline); border-radius: 12px; padding: 18px; }
.bar-row { display: grid; grid-template-columns: 260px 1fr 80px; gap: 12px; align-items: center; margin: 7px 0; }
.bar-label { font-size: 13px; color: var(--ink-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.bar-track { height: 14px; }
.bar-fill { height: 100%; background: var(--series-bright); border-radius: 0 4px 4px 0; min-width: 2px; }
.bar-value { font-size: 13px; text-align: right; font-variant-numeric: tabular-nums; color: #f2f6ff; }
footer { margin-top: 60px; text-align: center; color: var(--muted); font-size: 13px; }
footer a { color: var(--series); }
`;

const PNG_SCRIPT = `
document.getElementById('save-png').addEventListener('click', () => {
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
<style>${CSS}</style>
</head>
<body>
<div class="wrap">
  <div class="card-holder">
    ${card}
    <div class="card-actions">
      <button class="save-png" id="save-png">${icon('download', 16)}${esc(t('savePng'))}</button>
    </div>
    <div class="local-note">${icon('lock', 14)}${esc(t('localOnly'))}</div>
  </div>
  ${dashboard}
  <footer>${esc(t('generatedBy'))} <a href="https://github.com/hiroooo/cc-mastery">cc-mastery</a> v${esc(data.version)}</footer>
</div>
<script>${PNG_SCRIPT}</script>
</body>
</html>`;
}
