/**
 * Share card: 1200×675 (16:9) self-contained SVG — a holographic trading-card
 * treatment of your Claude Code mastery. The whole card is themed by rarity:
 * metallic frame, rainbow foil sheen, tier badge + stars, and accent ink all
 * shift with the tier (N silver → UC bronze → R blue → SR violet → SSR gold).
 *
 * Numerals use an embedded Orbitron face (font.js) for a game-HUD feel; body
 * text stays on the system sans. Everything is inlined so the SVG rasterizes
 * to PNG unchanged.
 *
 * Privacy contract: AGGREGATE NUMBERS ONLY. No skill names, project names,
 * paths, or model ids ever appear here (enforced by test/render.test.js).
 */
import { svgIcon, svgStar, STAT_ICONS } from './icons.js';
import { NUM_FONT_FAMILY, FONT_FACE_CSS } from './font.js';

const W = 1200;
const H = 675;
const NUM = NUM_FONT_FAMILY;
const FONT = `system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Noto Sans JP', sans-serif`;

const INK = '#ffffff';
const INK_SOFT = '#d3ddf2';
const MUTED = '#9aa0bb';
const GRID = 'rgba(255,255,255,0.14)';
const SERIES = '#57b0ff';

function esc(s) {
  return String(s).replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
}
function fmt(n) {
  return Number(n).toLocaleString('en-US');
}
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
    out += `<polygon points="${polygonPoints(cx, cy, (R * ring) / 4, n)}" fill="none" stroke="${GRID}" stroke-width="1"/>`;
  }
  for (let i = 0; i < n; i += 1) {
    const [x, y] = pt(cx, cy, R, (360 / n) * i);
    out += `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${GRID}" stroke-width="1"/>`;
  }
  out += `<polygon points="${polygonPoints(cx, cy, R, n, scores)}" fill="url(#radar-fill)" stroke="${SERIES}" stroke-width="2.5" stroke-linejoin="round" filter="url(#glow-blue)"/>`;
  for (let i = 0; i < n; i += 1) {
    const [x, y] = pt(cx, cy, (R * scores[i]) / 100, (360 / n) * i);
    out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="#bfe0ff" stroke="#0b1020" stroke-width="2"/>`;
  }
  for (let i = 0; i < n; i += 1) {
    const angle = (360 / n) * i;
    const [x, y] = pt(cx, cy, R + 30, angle);
    const isTop = angle < 10 || angle > 350;
    const isBottom = angle > 100 && angle < 260;
    const yL = isTop ? y - 26 : isBottom ? y + 10 : y - 8;
    const label = lang === 'ja' ? axes[i].ja : axes[i].en;
    out += `<text x="${x.toFixed(1)}" y="${yL.toFixed(1)}" text-anchor="middle" font-size="21" font-weight="700" fill="#efe7d0">${esc(label)}</text>`;
    out += `<text x="${x.toFixed(1)}" y="${(yL + 34).toFixed(1)}" text-anchor="middle" font-size="25" font-weight="800" fill="${INK}" font-family="${NUM}">${Math.round(axes[i].score)}</text>`;
  }
  return out;
}

function starRow(x, y, size, filled) {
  let out = '';
  for (let i = 0; i < 5; i += 1) {
    const lit = i < filled;
    out += svgStar(
      x + i * (size + 5),
      y,
      size,
      lit ? 'url(#frame-grad)' : 'rgba(255,255,255,0.10)',
      lit ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.18)'
    );
  }
  return out;
}

/** Rarity plate: [SSR] badge + star row. The badge + stars carry the tier,
 *  so no redundant tier-name label. */
function rarityPlate(rarity, x, y) {
  return `
    <g filter="url(#glow-accent)">
      <rect x="${x}" y="${y}" width="88" height="40" rx="9" fill="url(#frame-grad)"/>
    </g>
    <text x="${x + 44}" y="${y + 28}" text-anchor="middle" font-size="23" font-weight="900" fill="#15131f" letter-spacing="0.5" font-family="${NUM}">${esc(rarity.id)}</text>
    ${starRow(x + 104, y + 9, 24, rarity.stars)}`;
}

function statBand(stats, accentSoft, x, y, w, h) {
  const step = w / stats.length;
  let out = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="13" fill="rgba(6,10,22,0.55)" stroke="${accentSoft}" stroke-opacity="0.28" stroke-width="1"/>`;
  stats.forEach((s, i) => {
    const cxCell = x + step * i + step / 2;
    if (i > 0) {
      out += `<line x1="${(x + step * i).toFixed(1)}" y1="${y + 14}" x2="${(x + step * i).toFixed(1)}" y2="${y + h - 14}" stroke="${accentSoft}" stroke-opacity="0.18" stroke-width="1"/>`;
    }
    out += `<text x="${cxCell}" y="${y + 40}" text-anchor="middle" font-size="26" font-weight="800" fill="${INK}" font-family="${NUM}">${esc(fmt(s.value))}</text>`;
    const approxW = String(s.label).length * 13;
    const pairLeft = cxCell - (approxW + 20) / 2;
    out += svgIcon(STAT_ICONS[i] ?? 'zap', pairLeft, y + 52, 14, MUTED, 2.4);
    out += `<text x="${pairLeft + 20}" y="${y + 63}" font-size="13" fill="${MUTED}">${esc(s.label)}</text>`;
  });
  return out;
}

function corners(inset, len) {
  const a = inset;
  const b = W - inset;
  const c = H - inset;
  const s = `fill="none" stroke="url(#frame-grad)" stroke-width="3" stroke-linecap="round"`;
  return [
    `<path d="M${a} ${a + len}V${a}h${len}" ${s}/>`,
    `<path d="M${b - len} ${a}h${len}v${len}" ${s}/>`,
    `<path d="M${b} ${c - len}v${len}h${-len}" ${s}/>`,
    `<path d="M${a + len} ${c}h${-len}v${-len}" ${s}/>`,
  ].join('');
}

/**
 * Render the holo card SVG.
 * data = { score, title, stats, lang, t, generatedAt }
 */
export function renderCardSvg(data) {
  const { score, title, stats, lang, t, generatedAt } = data;
  const rarity = score.rarity;
  const p = rarity.palette;
  const accent = p.accent;
  const accentSoft = p.accentSoft;
  const titleText = lang === 'ja' ? title.ja : title.en;
  const titleSub = lang === 'ja' ? title.en : '';
  const holoOpacity = (0.08 + 0.3 * rarity.holo).toFixed(3);

  const cx = 862;
  const cy = 306;
  const R = 165;

  return `<svg id="card-svg" xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Claude Code mastery holo card">
  <defs>
    <style>${FONT_FACE_CSS}</style>
    <radialGradient id="bg-glow" cx="0.7" cy="0.26" r="1.15">
      <stop offset="0" stop-color="${p.bg[0]}"/>
      <stop offset="0.45" stop-color="${p.bg[1]}"/>
      <stop offset="1" stop-color="${p.bg[2]}"/>
    </radialGradient>
    <linearGradient id="frame-grad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${p.frame[0]}"/>
      <stop offset="0.3" stop-color="${p.frameMid}"/>
      <stop offset="0.52" stop-color="${p.frame[1]}"/>
      <stop offset="0.72" stop-color="${p.frameMid}"/>
      <stop offset="1" stop-color="${p.frame[0]}"/>
    </linearGradient>
    <linearGradient id="holo" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ff4d6d"/><stop offset="0.18" stop-color="#ffa63d"/>
      <stop offset="0.36" stop-color="#ffe34d"/><stop offset="0.54" stop-color="#4dffa3"/>
      <stop offset="0.72" stop-color="#43d9ff"/><stop offset="0.86" stop-color="#6b7bff"/>
      <stop offset="1" stop-color="#c86bff"/>
    </linearGradient>
    <linearGradient id="radar-fill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#57b0ff" stop-opacity="0.45"/>
      <stop offset="1" stop-color="#57b0ff" stop-opacity="0.07"/>
    </linearGradient>
    <linearGradient id="lv-fill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#bcc9e6"/>
    </linearGradient>
    <linearGradient id="hairline" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${accentSoft}"/><stop offset="1" stop-color="rgba(0,0,0,0)"/>
    </linearGradient>
    <filter id="glow-blue" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="0" stdDeviation="10" flood-color="#3987e5" flood-opacity="0.6"/>
    </filter>
    <filter id="glow-accent" x="-60%" y="-60%" width="220%" height="220%">
      <feDropShadow dx="0" dy="0" stdDeviation="7" flood-color="${accent}" flood-opacity="0.5"/>
    </filter>
    <filter id="lv-glow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="0" stdDeviation="14" flood-color="#9fc0ff" flood-opacity="0.28"/>
    </filter>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg-glow)"/>
  <g opacity="${holoOpacity}">
    <rect width="${W}" height="${H}" fill="url(#holo)" transform="skewX(-18)" style="mix-blend-mode:screen"/>
    <rect width="${W}" height="${H}" fill="url(#holo)" transform="translate(240 0) skewX(22)" style="mix-blend-mode:screen"/>
  </g>
  <rect width="${W}" height="${H}" fill="#0b1226" opacity="0.28"/>

  <rect x="9" y="9" width="${W - 18}" height="${H - 18}" rx="20" fill="none" stroke="url(#frame-grad)" stroke-width="3"/>
  <rect x="18" y="18" width="${W - 36}" height="${H - 36}" rx="14" fill="none" stroke="${accentSoft}" stroke-opacity="0.22" stroke-width="1"/>
  ${corners(30, 30)}

  <g font-family="${FONT}">
    <!-- header -->
    ${svgIcon('swords', 66, 50, 20, accent)}
    <text x="98" y="66" font-size="19" font-weight="700" letter-spacing="4.5" fill="${accent}">${esc(t('cardTitle'))}</text>
    <text x="${W - 66}" y="66" text-anchor="end" font-size="14" letter-spacing="1" fill="${MUTED}" font-family="${NUM}">${esc(generatedAt)}</text>

    <!-- rarity plate -->
    ${rarityPlate(rarity, 72, 110)}

    <!-- level -->
    <text x="76" y="222" font-size="22" font-weight="700" letter-spacing="3" fill="${accent}">${esc(t('level'))}.</text>
    <text x="70" y="360" font-size="150" font-weight="800" fill="url(#lv-fill)" filter="url(#lv-glow)" font-family="${NUM}" letter-spacing="-2">${score.level}</text>
    <line x1="80" y1="394" x2="490" y2="394" stroke="url(#hairline)" stroke-width="1.5"/>
    <text x="80" y="439" font-size="41" font-weight="800" fill="${accent}">${esc(titleText)}</text>
    ${titleSub ? `<text x="80" y="469" font-size="20" font-weight="600" fill="${accentSoft}">${esc(titleSub)}</text>` : ''}

    <!-- deviation pill (hover shows the formula in-browser; not baked into PNG) -->
    <g><title>${esc(t('deviationTip'))}</title>
      <rect x="80" y="488" width="292" height="42" rx="21" fill="rgba(6,10,22,0.5)" stroke="${accentSoft}" stroke-opacity="0.3"/>
      ${svgIcon('gauge', 100, 499, 19, INK_SOFT)}
      <text x="127" y="515" font-size="18" font-weight="600" fill="${INK_SOFT}">${esc(t('deviation'))}</text>
      <text x="348" y="517" font-size="24" font-weight="800" fill="${INK}" text-anchor="end" font-family="${NUM}">${score.deviation}</text>
    </g>

    <!-- radar -->
    ${radar(score.axes, lang, cx, cy, R)}

    <!-- stat band -->
    ${statBand(stats, accentSoft, 66, 540, W - 132, 78)}

    <!-- footer (kept clear of the band and the frame) -->
    <text x="66" y="650" font-size="13" fill="${MUTED}">${esc(t('estimated'))}</text>
    <text x="${W - 66}" y="650" font-size="15" font-weight="700" text-anchor="end" fill="${accent}">npx cc-mastery</text>
  </g>
</svg>`;
}
