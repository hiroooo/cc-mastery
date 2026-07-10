/**
 * Share card: 1200×675 (16:9) self-contained SVG — a holographic trading-card
 * treatment of your Claude Code mastery. Gold metallic frame, rainbow foil
 * sheen (intensity scales with rarity), tier badge + star rating, glowing radar.
 *
 * Privacy contract: AGGREGATE NUMBERS ONLY. No skill names, project names,
 * paths, or model ids ever appear here (enforced by test/render.test.js).
 *
 * The card is a static, self-contained SVG so it exports cleanly to PNG. The
 * live "holo shimmer" (a moving rainbow overlay) is added in html.js with CSS
 * and deliberately does NOT bake into the PNG.
 */
import { svgIcon, svgStar, STAT_ICONS } from './icons.js';

const W = 1200;
const H = 675;

const C = {
  ink: '#ffffff',
  inkSoft: '#d3ddf2',
  label: '#efe7d0',
  muted: '#9aa0bb',
  gridLine: 'rgba(255,255,255,0.14)',
  series: '#57b0ff',
  gold: '#f4d27a',
  goldDeep: '#c99a3a',
};

const FONT = `system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Noto Sans JP', sans-serif`;

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
    out += `<polygon points="${polygonPoints(cx, cy, (R * ring) / 4, n)}" fill="none" stroke="${C.gridLine}" stroke-width="1"/>`;
  }
  for (let i = 0; i < n; i += 1) {
    const [x, y] = pt(cx, cy, R, (360 / n) * i);
    out += `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${C.gridLine}" stroke-width="1"/>`;
  }
  out += `<polygon points="${polygonPoints(cx, cy, R, n, scores)}" fill="url(#radar-fill)" stroke="${C.series}" stroke-width="2.5" stroke-linejoin="round" filter="url(#glow-blue)"/>`;
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
    out += `<text x="${x.toFixed(1)}" y="${yL.toFixed(1)}" text-anchor="middle" font-size="21" font-weight="700" fill="${C.label}">${esc(label)}</text>`;
    out += `<text x="${x.toFixed(1)}" y="${(yL + 33).toFixed(1)}" text-anchor="middle" font-size="26" font-weight="800" fill="${C.ink}" style="font-variant-numeric:tabular-nums">${Math.round(axes[i].score)}</text>`;
  }
  return out;
}

/** Five-star row; `filled` of them lit gold, the rest dim. */
function starRow(x, y, size, filled) {
  let out = '';
  for (let i = 0; i < 5; i += 1) {
    const lit = i < filled;
    out += svgStar(
      x + i * (size + 4),
      y,
      size,
      lit ? 'url(#gold-grad)' : 'rgba(255,255,255,0.10)',
      lit ? '#b8860b' : 'rgba(255,255,255,0.18)'
    );
  }
  return out;
}

/** Rarity plate: [SSR] + stars + tier name. */
function rarityPlate(rarity, lang, x, y) {
  const name = lang === 'ja' ? rarity.ja : rarity.en;
  return `
    <g filter="url(#glow-gold)">
      <rect x="${x}" y="${y}" width="86" height="40" rx="9" fill="url(#gold-grad)"/>
    </g>
    <text x="${x + 43}" y="${y + 28}" text-anchor="middle" font-size="23" font-weight="900" fill="#2a1e05" letter-spacing="0.5">${esc(rarity.id)}</text>
    ${starRow(x + 98, y + 9, 21, rarity.stars)}
    <text x="${x + 98}" y="${y + 38}" font-size="14" font-weight="700" letter-spacing="3" fill="${C.gold}">${esc(name.toUpperCase())}</text>`;
}

function statBand(stats, x, y, w, h) {
  const step = w / stats.length;
  let out = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="13" fill="rgba(6,10,22,0.55)" stroke="rgba(244,210,122,0.22)" stroke-width="1"/>`;
  stats.forEach((s, i) => {
    const cxCell = x + step * i + step / 2;
    if (i > 0) {
      out += `<line x1="${(x + step * i).toFixed(1)}" y1="${y + 14}" x2="${(x + step * i).toFixed(1)}" y2="${y + h - 14}" stroke="rgba(244,210,122,0.16)" stroke-width="1"/>`;
    }
    out += `<text x="${cxCell}" y="${y + 40}" text-anchor="middle" font-size="27" font-weight="800" fill="${C.ink}" style="font-variant-numeric:tabular-nums">${esc(fmt(s.value))}</text>`;
    const approxW = String(s.label).length * 13;
    const pairLeft = cxCell - (approxW + 20) / 2;
    out += svgIcon(STAT_ICONS[i] ?? 'zap', pairLeft, y + 52, 14, C.muted, 2.4);
    out += `<text x="${pairLeft + 20}" y="${y + 63}" font-size="13" fill="${C.muted}">${esc(s.label)}</text>`;
  });
  return out;
}

/** Ornate gold corner brackets on all four corners. */
function corners(inset, len) {
  const a = inset;
  const b = W - inset;
  const c = H - inset;
  const s = `fill="none" stroke="url(#gold-grad)" stroke-width="3" stroke-linecap="round"`;
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
  const titleText = lang === 'ja' ? title.ja : title.en;
  const titleSub = lang === 'ja' ? title.en : '';
  const holoOpacity = (0.1 + 0.28 * rarity.holo).toFixed(3);

  const cx = 862;
  const cy = 306;
  const R = 165;

  return `<svg id="card-svg" xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Claude Code mastery holo card">
  <defs>
    <radialGradient id="bg-glow" cx="0.7" cy="0.26" r="1.15">
      <stop offset="0" stop-color="#1d2a4d"/>
      <stop offset="0.45" stop-color="#121b34"/>
      <stop offset="1" stop-color="#080c18"/>
    </radialGradient>
    <linearGradient id="gold-grad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#7a5a14"/>
      <stop offset="0.28" stop-color="#f4d27a"/>
      <stop offset="0.52" stop-color="#fff6cc"/>
      <stop offset="0.72" stop-color="#d4af37"/>
      <stop offset="1" stop-color="#8a6518"/>
    </linearGradient>
    <linearGradient id="holo" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ff4d6d"/>
      <stop offset="0.18" stop-color="#ffa63d"/>
      <stop offset="0.36" stop-color="#ffe34d"/>
      <stop offset="0.54" stop-color="#4dffa3"/>
      <stop offset="0.72" stop-color="#43d9ff"/>
      <stop offset="0.86" stop-color="#6b7bff"/>
      <stop offset="1" stop-color="#c86bff"/>
    </linearGradient>
    <linearGradient id="radar-fill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#57b0ff" stop-opacity="0.45"/>
      <stop offset="1" stop-color="#57b0ff" stop-opacity="0.07"/>
    </linearGradient>
    <linearGradient id="lv-fill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="1" stop-color="#bcc9e6"/>
    </linearGradient>
    <linearGradient id="hairline" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="rgba(244,210,122,0.55)"/>
      <stop offset="1" stop-color="rgba(244,210,122,0)"/>
    </linearGradient>
    <filter id="glow-blue" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="0" stdDeviation="10" flood-color="#3987e5" flood-opacity="0.6"/>
    </filter>
    <filter id="glow-gold" x="-60%" y="-60%" width="220%" height="220%">
      <feDropShadow dx="0" dy="0" stdDeviation="7" flood-color="#f4d27a" flood-opacity="0.55"/>
    </filter>
    <filter id="lv-glow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="0" stdDeviation="14" flood-color="#9fc0ff" flood-opacity="0.28"/>
    </filter>
  </defs>

  <!-- base + holo foil -->
  <rect width="${W}" height="${H}" fill="url(#bg-glow)"/>
  <g opacity="${holoOpacity}">
    <rect width="${W}" height="${H}" fill="url(#holo)" transform="skewX(-18)" style="mix-blend-mode:screen"/>
    <rect width="${W}" height="${H}" fill="url(#holo)" transform="translate(240 0) skewX(22)" style="mix-blend-mode:screen"/>
  </g>
  <rect width="${W}" height="${H}" fill="#0b1226" opacity="0.28"/>

  <!-- gold frame -->
  <rect x="9" y="9" width="${W - 18}" height="${H - 18}" rx="20" fill="none" stroke="url(#gold-grad)" stroke-width="3"/>
  <rect x="18" y="18" width="${W - 36}" height="${H - 36}" rx="14" fill="none" stroke="rgba(244,210,122,0.22)" stroke-width="1"/>
  ${corners(30, 30)}

  <g font-family="${FONT}">
    <!-- header -->
    ${svgIcon('swords', 66, 50, 20, C.gold)}
    <text x="98" y="66" font-size="19" font-weight="700" letter-spacing="4.5" fill="${C.gold}">${esc(t('cardTitle'))}</text>
    <text x="${W - 66}" y="66" text-anchor="end" font-size="14" letter-spacing="1" fill="${C.muted}" style="font-variant-numeric:tabular-nums">${esc(generatedAt)}</text>

    <!-- rarity plate -->
    ${rarityPlate(rarity, lang, 72, 108)}

    <!-- level -->
    <text x="76" y="212" font-size="23" font-weight="700" letter-spacing="3" fill="${C.gold}">${esc(t('level'))}.</text>
    <text x="70" y="358" font-size="158" font-weight="900" fill="url(#lv-fill)" filter="url(#lv-glow)" style="font-variant-numeric:tabular-nums">${score.level}</text>
    <line x1="80" y1="392" x2="490" y2="392" stroke="url(#hairline)" stroke-width="1.5"/>
    <text x="80" y="437" font-size="41" font-weight="800" fill="${C.gold}">${esc(titleText)}</text>
    ${titleSub ? `<text x="80" y="467" font-size="20" font-weight="600" fill="rgba(244,210,122,0.8)">${esc(titleSub)}</text>` : ''}

    <!-- deviation pill -->
    <rect x="80" y="486" width="292" height="42" rx="21" fill="rgba(6,10,22,0.5)" stroke="rgba(244,210,122,0.28)"/>
    ${svgIcon('gauge', 100, 497, 19, C.inkSoft)}
    <text x="127" y="513" font-size="18" font-weight="600" fill="${C.inkSoft}">${esc(t('deviation'))}</text>
    <text x="348" y="515" font-size="24" font-weight="800" fill="${C.ink}" text-anchor="end" style="font-variant-numeric:tabular-nums">${score.deviation}</text>

    <!-- radar -->
    ${radar(score.axes, lang, cx, cy, R)}

    <!-- stat band -->
    ${statBand(stats, 66, 546, W - 132, 80)}

    <!-- footer -->
    <text x="66" y="642" font-size="13" fill="${C.muted}">${esc(t('estimated'))}</text>
    <text x="${W - 66}" y="642" font-size="15" font-weight="700" text-anchor="end" fill="${C.gold}">npx cc-mastery</text>
  </g>
</svg>`;
}
