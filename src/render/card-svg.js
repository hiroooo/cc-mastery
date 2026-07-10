/**
 * Share card: 1200×675 (16:9, X-inline friendly) self-contained SVG.
 *
 * Privacy contract: the card shows AGGREGATE NUMBERS ONLY. No skill names,
 * no project names, no paths, no model names ever appear here (enforced by
 * test/render.test.js).
 *
 * Composition: framed RPG card — badge header (no full-width rules), left
 * column (level / title / std-score pill), right radar zone with glow, and a
 * bottom stat band. Radar labels own their zone, so nothing can collide.
 */
import { svgIcon, STAT_ICONS } from './icons.js';

const W = 1200;
const H = 675;

const C = {
  ink: '#ffffff',
  inkSoft: '#cfd8ea',
  label: '#e8e2d2',
  muted: '#8b92a8',
  frame: 'rgba(255,255,255,0.10)',
  goldFrame: 'rgba(232,182,76,0.28)',
  grid: 'rgba(255,255,255,0.13)',
  series: '#4a99f0',
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

  for (let ring = 1; ring <= 4; ring += 1) {
    out += `<polygon points="${polygonPoints(cx, cy, (R * ring) / 4, n)}" fill="none" stroke="${C.grid}" stroke-width="1"/>`;
  }
  for (let i = 0; i < n; i += 1) {
    const [x, y] = pt(cx, cy, R, (360 / n) * i);
    out += `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${C.grid}" stroke-width="1"/>`;
  }
  out += `<polygon points="${polygonPoints(cx, cy, R, n, scores)}" fill="url(#radar-fill)" stroke="${C.series}" stroke-width="2.5" stroke-linejoin="round" filter="url(#radar-glow)"/>`;
  for (let i = 0; i < n; i += 1) {
    const [x, y] = pt(cx, cy, (R * scores[i]) / 100, (360 / n) * i);
    out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="#9cc6f7" stroke="#0d1322" stroke-width="2"/>`;
  }
  // labels: name + score stacked, ALL middle-anchored so long CJK labels
  // stay inside the card frame; vertical offset varies by zone (top/side/bottom)
  for (let i = 0; i < n; i += 1) {
    const angle = (360 / n) * i;
    const [x, y] = pt(cx, cy, R + 30, angle);
    const isTop = angle < 10 || angle > 350;
    const isBottom = angle > 100 && angle < 260;
    const yL = isTop ? y - 26 : isBottom ? y + 10 : y - 8;
    const label = lang === 'ja' ? axes[i].ja : axes[i].en;
    out += `<text x="${x.toFixed(1)}" y="${yL.toFixed(1)}" text-anchor="middle" font-size="21" font-weight="700" fill="${C.label}">${esc(label)}</text>`;
    out += `<text x="${x.toFixed(1)}" y="${(yL + 33).toFixed(1)}" text-anchor="middle" font-size="26" font-weight="800" fill="${C.ink}" style="font-variant-numeric:tabular-nums">${Math.round(axes[i].score)}</text>`;
  }
  return out;
}

/** Bottom stat band: value on top, icon + label underneath, hairline dividers. */
function statBand(stats, x, y, w, h) {
  const step = w / stats.length;
  let out = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="rgba(255,255,255,0.035)" stroke="${C.frame}" stroke-width="1"/>`;
  stats.forEach((s, i) => {
    const cxCell = x + step * i + step / 2;
    if (i > 0) {
      out += `<line x1="${(x + step * i).toFixed(1)}" y1="${y + 14}" x2="${(x + step * i).toFixed(1)}" y2="${y + h - 14}" stroke="rgba(255,255,255,0.07)" stroke-width="1"/>`;
    }
    out += `<text x="${cxCell}" y="${y + 40}" text-anchor="middle" font-size="27" font-weight="800" fill="${C.ink}" style="font-variant-numeric:tabular-nums">${esc(fmt(s.value))}</text>`;
    // icon + label centered as a pair: icon sits left of the label text
    const labelLen = String(s.label).length;
    const approxW = labelLen * 13; // CJK-ish estimate, good enough to center
    const pairLeft = cxCell - (approxW + 20) / 2;
    out += svgIcon(STAT_ICONS[i] ?? 'zap', pairLeft, y + 52, 14, C.muted, 2.4);
    out += `<text x="${pairLeft + 20}" y="${y + 63}" font-size="13" fill="${C.muted}">${esc(s.label)}</text>`;
  });
  return out;
}

/** Corner accents: short gold ticks that read as a game-card frame. */
function cornerTicks(inset, len) {
  const a = inset;
  const b = W - inset;
  const c = H - inset;
  const s = `stroke="${C.goldFrame}" stroke-width="2" stroke-linecap="round"`;
  return `
    <path d="M${a} ${a + len}V${a}h${len}" fill="none" ${s}/>
    <path d="M${b - len} ${a}h${len}v${len}" fill="none" ${s}/>
    <path d="M${b} ${c - len}v${len}h${-len}" fill="none" ${s}/>
    <path d="M${a + len} ${c}h${-len}v${-len}" fill="none" ${s}/>`;
}

/**
 * Render the share card SVG.
 * data = { score, title, stats, lang, t, generatedAt }
 */
export function renderCardSvg(data) {
  const { score, title, stats, lang, t, generatedAt } = data;
  const titleText = lang === 'ja' ? title.ja : title.en;
  const titleSub = lang === 'ja' ? title.en : '';

  const cx = 858;
  const cy = 300;
  const R = 168;

  return `<svg id="card-svg" xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Claude Code mastery card">
  <defs>
    <radialGradient id="bg-glow" cx="0.72" cy="0.28" r="1.1">
      <stop offset="0" stop-color="#1b2745"/>
      <stop offset="0.45" stop-color="#121a30"/>
      <stop offset="1" stop-color="#0b101e"/>
    </radialGradient>
    <linearGradient id="radar-fill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#4a99f0" stop-opacity="0.42"/>
      <stop offset="1" stop-color="#4a99f0" stop-opacity="0.08"/>
    </linearGradient>
    <linearGradient id="lv-fill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="1" stop-color="#b9c6e2"/>
    </linearGradient>
    <linearGradient id="hairline" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="rgba(255,255,255,0.14)"/>
      <stop offset="1" stop-color="rgba(255,255,255,0)"/>
    </linearGradient>
    <filter id="radar-glow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="0" stdDeviation="10" flood-color="#3987e5" flood-opacity="0.55"/>
    </filter>
    <filter id="lv-glow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="0" stdDeviation="14" flood-color="#8fb7ff" flood-opacity="0.22"/>
    </filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg-glow)"/>
  <rect x="16" y="16" width="${W - 32}" height="${H - 32}" rx="18" fill="none" stroke="${C.frame}" stroke-width="1"/>
  ${cornerTicks(28, 26)}
  <g font-family="${FONT}">
    <!-- header badge (no full-width rule) -->
    ${svgIcon('swords', 64, 52, 20, C.goldDim)}
    <text x="96" y="68" font-size="19" font-weight="700" letter-spacing="4.5" fill="${C.goldDim}">${esc(t('cardTitle'))}</text>
    <text x="${W - 64}" y="68" text-anchor="end" font-size="14" letter-spacing="1" fill="${C.muted}" style="font-variant-numeric:tabular-nums">${esc(generatedAt)}</text>

    <!-- left column -->
    <text x="82" y="188" font-size="24" font-weight="700" letter-spacing="3" fill="${C.gold}">${esc(t('level'))}.</text>
    <text x="76" y="352" font-size="168" font-weight="900" fill="url(#lv-fill)" filter="url(#lv-glow)" style="font-variant-numeric:tabular-nums">${score.level}</text>
    <line x1="80" y1="386" x2="480" y2="386" stroke="url(#hairline)" stroke-width="1"/>
    <text x="80" y="432" font-size="42" font-weight="800" fill="${C.gold}">${esc(titleText)}</text>
    ${titleSub ? `<text x="80" y="463" font-size="20" font-weight="600" fill="${C.goldDim}">${esc(titleSub)}</text>` : ''}

    <!-- estimated standard score pill -->
    <rect x="80" y="484" width="292" height="44" rx="22" fill="rgba(255,255,255,0.05)" stroke="${C.frame}"/>
    ${svgIcon('gauge', 100, 496, 19, C.inkSoft)}
    <text x="127" y="512" font-size="19" font-weight="600" fill="${C.inkSoft}">${esc(t('deviation'))}</text>
    <text x="348" y="514" font-size="25" font-weight="800" fill="${C.ink}" text-anchor="end" style="font-variant-numeric:tabular-nums">${score.deviation}</text>

    <!-- radar zone (owns x 560..1160, y 90..530) -->
    ${radar(score.axes, lang, cx, cy, R)}

    <!-- stat band -->
    ${statBand(stats, 64, 544, W - 128, 80)}

    <!-- footer (≥32px clear of the card edge for X-preview crops) -->
    <text x="64" y="641" font-size="13" fill="${C.muted}">${esc(t('estimated'))}</text>
    <text x="${W - 64}" y="641" font-size="15" font-weight="700" text-anchor="end" fill="${C.goldDim}">npx cc-mastery</text>
  </g>
</svg>`;
}
