/**
 * Share card: 1200×675 (16:9, X-inline friendly) self-contained SVG.
 *
 * Privacy contract: the card shows AGGREGATE NUMBERS ONLY. No skill names,
 * no project names, no paths, no model names ever appear here (enforced by
 * test/render.test.js).
 */

import { svgIcon, STAT_ICONS } from './icons.js';

const W = 1200;
const H = 675;

// palette (dark surface, single data series = blue, gold accent for level/title)
const C = {
  bgTop: '#0d1220',
  bgBottom: '#111a30',
  frame: 'rgba(255,255,255,0.10)',
  ink: '#ffffff',
  inkSecondary: '#c3c2b7',
  label: '#e8e2d2',
  muted: '#8b8fa3',
  grid: 'rgba(255,255,255,0.15)',
  series: '#3987e5',
  seriesFill: 'rgba(57,135,229,0.28)',
  gold: '#f0c05a',
  goldDim: 'rgba(232,182,76,0.85)',
};

const FONT = `system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Noto Sans JP', sans-serif`;

function esc(s) {
  return String(s).replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
}

function fmt(n) {
  return Number(n).toLocaleString('en-US');
}

/** Polar → cartesian. angleDeg measured from 12 o'clock, clockwise. */
function pt(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

function polygonPoints(cx, cy, r, n, scores = null) {
  const pts = [];
  for (let i = 0; i < n; i += 1) {
    const rr = scores ? (r * scores[i]) / 100 : r;
    pts.push(pt(cx, cy, rr, (360 / n) * i).map((v) => v.toFixed(1)).join(','));
  }
  return pts.join(' ');
}

function radar(axes, lang, cx, cy, R) {
  const n = axes.length;
  const scores = axes.map((a) => a.score);
  let out = '';

  // grid rings (pentagons at 20..100)
  for (let ring = 1; ring <= 5; ring += 1) {
    out += `<polygon points="${polygonPoints(cx, cy, (R * ring) / 5, n)}" fill="none" stroke="${C.grid}" stroke-width="1"/>`;
  }
  // spokes
  for (let i = 0; i < n; i += 1) {
    const [x, y] = pt(cx, cy, R, (360 / n) * i);
    out += `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${C.grid}" stroke-width="1"/>`;
  }
  // score polygon
  out += `<polygon points="${polygonPoints(cx, cy, R, n, scores)}" fill="${C.seriesFill}" stroke="${C.series}" stroke-width="2.5" stroke-linejoin="round"/>`;
  // vertex markers
  for (let i = 0; i < n; i += 1) {
    const [x, y] = pt(cx, cy, (R * scores[i]) / 100, (360 / n) * i);
    out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.5" fill="${C.series}" stroke="${C.bgTop}" stroke-width="2"/>`;
  }
  // direct labels: axis name + score (single series → no legend)
  for (let i = 0; i < n; i += 1) {
    const angle = (360 / n) * i;
    const [x, y] = pt(cx, cy, R + 24, angle);
    const anchor = angle < 10 || angle > 350 ? 'middle' : angle < 180 ? 'start' : 'end';
    const label = lang === 'ja' ? axes[i].ja : axes[i].en;
    const dy = angle < 10 || angle > 350 ? -8 : 0;
    out += `<text x="${x.toFixed(1)}" y="${(y + dy).toFixed(1)}" text-anchor="${anchor}" font-size="23" font-weight="700" fill="${C.label}">${esc(label)}</text>`;
    out += `<text x="${x.toFixed(1)}" y="${(y + dy + 29).toFixed(1)}" text-anchor="${anchor}" font-size="27" font-weight="800" fill="${C.ink}">${Math.round(axes[i].score)}</text>`;
  }
  return out;
}

function statRow(stats, y) {
  const usable = W - 160;
  const step = usable / stats.length;
  let out = '';
  stats.forEach((s, i) => {
    const x = 80 + step * i + step / 2;
    out += svgIcon(STAT_ICONS[i] ?? 'zap', x - 9, y - 38, 18, '#b3b9c8', 2.75);
    out += `<text x="${x}" y="${y}" text-anchor="middle" font-size="27" font-weight="800" fill="${C.ink}">${esc(fmt(s.value))}</text>`;
    out += `<text x="${x}" y="${y + 22}" text-anchor="middle" font-size="14" fill="${C.muted}">${esc(s.label)}</text>`;
  });
  return out;
}

/**
 * Render the share card SVG.
 * data = { score (computeScores output), title ({ja,en}), stats: [{label,value}×6],
 *          lang, t (i18n), generatedAt (ISO date string) }
 */
export function renderCardSvg(data) {
  const { score, title, stats, lang, t, generatedAt } = data;
  const titleText = lang === 'ja' ? title.ja : title.en;
  const titleSub = lang === 'ja' ? title.en : '';

  const cx = 785;
  const cy = 305;
  const R = 200;

  return `<svg id="card-svg" xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Claude Code mastery card">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${C.bgTop}"/>
      <stop offset="1" stop-color="${C.bgBottom}"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" rx="0" fill="url(#bg)"/>
  <rect x="14" y="14" width="${W - 28}" height="${H - 28}" rx="18" fill="none" stroke="${C.frame}" stroke-width="1.5"/>
  <g font-family="${FONT}">
    <!-- header -->
    ${svgIcon('swords', 80, 66, 22, C.goldDim)}
    <text x="114" y="86" font-size="22" font-weight="700" letter-spacing="5" fill="${C.goldDim}">${esc(t('cardTitle'))}</text>
    <line x1="80" y1="104" x2="${W - 80}" y2="104" stroke="${C.frame}" stroke-width="1"/>

    <!-- level block -->
    <text x="80" y="192" font-size="26" font-weight="700" fill="${C.muted}">${esc(t('level'))}</text>
    <text x="80" y="330" font-size="150" font-weight="900" fill="${C.ink}">${score.level}</text>
    <text x="80" y="388" font-size="43" font-weight="800" fill="${C.gold}">${esc(titleText)}</text>
    ${titleSub ? `<text x="80" y="420" font-size="21" font-weight="600" fill="${C.goldDim}">${esc(titleSub)}</text>` : ''}

    <!-- estimated standard score pill -->
    <rect x="80" y="448" width="300" height="46" rx="23" fill="rgba(255,255,255,0.06)" stroke="${C.frame}"/>
    ${svgIcon('gauge', 102, 461, 20, C.inkSecondary)}
    <text x="130" y="478" font-size="20" font-weight="600" fill="${C.inkSecondary}">${esc(t('deviation'))}</text>
    <text x="356" y="480" font-size="26" font-weight="800" fill="${C.ink}" text-anchor="end">${score.deviation}</text>

    <!-- radar -->
    ${radar(score.axes, lang, cx, cy, R)}

    <!-- stats -->
    <line x1="80" y1="530" x2="${W - 80}" y2="530" stroke="${C.frame}" stroke-width="1"/>
    ${statRow(stats, 586)}

    <!-- footer -->
    <text x="80" y="638" font-size="15" fill="${C.muted}">${esc(generatedAt)} · ${esc(t('estimated'))}</text>
    <text x="${W - 80}" y="638" font-size="16" font-weight="700" text-anchor="end" fill="${C.inkSecondary}">npx cc-mastery</text>
  </g>
</svg>`;
}
