/**
 * Detail dashboard (local viewing only — this section DOES show skill /
 * project / model names, behind an explicit "don't screenshot this" banner).
 */
import { icon } from './icons.js';
import { BASELINE, LEVEL_GAMMA } from '../scorer.js';
import { RARITY_TIERS } from '../rarity.js';

function esc(s) {
  return String(s).replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
}

function fmt(n) {
  return Number(n).toLocaleString('en-US');
}

// sequential blue ramp on the dark surface (low → high)
const HEAT_STEPS = ['#1c4f8f', '#2a70c4', '#4a99f0', '#8fc0f7'];

const DAY_MS = 24 * 60 * 60 * 1000;

function heatmap(dayCounts, lang, t) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  // Adaptive range: transcripts are pruned after ~30 days by default, so a
  // fixed 52-week grid would render mostly empty. Span the observed data
  // (min 12 weeks, max 52), then snap to the preceding Sunday.
  const days = Object.keys(dayCounts).sort();
  const oldest = days.length ? Date.parse(`${days[0]}T00:00:00Z`) : today.getTime();
  const spanDays = Math.min(
    364,
    Math.max(84, Math.ceil((today.getTime() - oldest) / DAY_MS) + 7)
  );
  const start = new Date(today.getTime() - spanDays * DAY_MS);
  start.setUTCDate(start.getUTCDate() - start.getUTCDay());

  const max = Math.max(1, ...Object.values(dayCounts));
  const cols = [];
  const monthLabels = [];
  let lastMonth = -1;
  let colIndex = 0;
  for (let ws = new Date(start); ws <= today; ws = new Date(ws.getTime() + 7 * DAY_MS)) {
    const m = ws.getUTCMonth();
    if (m !== lastMonth) {
      monthLabels.push(
        `<span style="grid-column:${colIndex + 1}">${lang === 'ja' ? `${m + 1}月` : ws.toLocaleString('en', { month: 'short', timeZone: 'UTC' })}</span>`
      );
      lastMonth = m;
    }
    const cells = [];
    for (let d = 0; d < 7; d += 1) {
      const day = new Date(ws.getTime() + d * DAY_MS);
      if (day > today) break;
      const key = day.toISOString().slice(0, 10);
      const count = dayCounts[key] ?? 0;
      let bg = 'var(--cell-empty)';
      if (count > 0) {
        const idx = Math.min(
          HEAT_STEPS.length - 1,
          Math.floor((count / max) * HEAT_STEPS.length)
        );
        bg = HEAT_STEPS[idx];
      }
      cells.push(
        `<div class="hm-cell" style="background:${bg}" title="${key}: ${count}"></div>`
      );
    }
    cols.push(`<div class="hm-col">${cells.join('')}</div>`);
    colIndex += 1;
  }
  const dow = lang === 'ja' ? ['月', '水', '金'] : ['Mon', 'Wed', 'Fri'];
  const legendCells = HEAT_STEPS.map((c) => `<i style="background:${c}"></i>`).join('');
  return `<section>
    <h2>${icon('activity', 15)}<span>${esc(t('heatmapHeading'))}</span></h2>
    <div class="panel">
      <div class="hm-wrap">
        <div class="hm-dow"><span>${dow[0]}</span><span>${dow[1]}</span><span>${dow[2]}</span></div>
        <div class="hm-scroll">
          <div class="hm-months" style="grid-template-columns: repeat(${colIndex}, 20px)">${monthLabels.join('')}</div>
          <div class="hm-grid">${cols.join('')}</div>
        </div>
      </div>
      <div class="hm-legend"><span>${lang === 'ja' ? '少' : 'less'}</span><i style="background:var(--cell-empty)"></i>${legendCells}<span>${lang === 'ja' ? '多' : 'more'}</span></div>
    </div>
  </section>`;
}

function breakdownTables(score, lang, t) {
  const sections = score.axes
    .map((axis) => {
      const rows = axis.breakdown
        .map(
          (m) => `<tr>
        <td>${esc(lang === 'ja' ? m.ja : m.en)}</td>
        <td class="num">${fmt(m.x)}</td>
        <td class="num dim">${m.h == null ? '—' : fmt(m.h)}</td>
        <td class="num dim">${m.w.toFixed(2)}</td>
        <td class="num strong"><span class="mini-track"><span style="width:${Math.min(100, m.points)}%"></span></span>${m.points}</td>
      </tr>`
        )
        .join('');
      const s = Math.round(axis.score);
      return `<div class="axis-table">
      <h3><span>${esc(lang === 'ja' ? axis.ja : axis.en)}</span><span class="axis-score">${s}</span></h3>
      <div class="axis-bar"><span style="width:${s}%"></span></div>
      <table>
        <thead><tr><th>${esc(t('colMetric'))}</th><th class="num">${esc(t('colValue'))}</th><th class="num">${esc(t('colHalf'))}</th><th class="num">${esc(t('colWeight'))}</th><th class="num">${esc(t('colPoints'))}</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
    })
    .join('');
  return `<section><h2>${icon('table', 15)}<span>${esc(t('breakdownHeading'))}</span></h2><div class="axis-grid">${sections}</div></section>`;
}

function barList(entries, heading, iconName) {
  if (entries.length === 0) return '';
  const max = Math.max(...entries.map(([, v]) => v));
  const rows = entries
    .map(
      ([name, v], i) => `<div class="bar-row">
      <div class="bar-rank">${i + 1}</div>
      <div class="bar-label" title="${esc(name)}">${esc(name)}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${((100 * v) / max).toFixed(1)}%"></div></div>
      <div class="bar-value">${fmt(v)}</div>
    </div>`
    )
    .join('');
  return `<section><h2>${icon(iconName, 15)}<span>${esc(heading)}</span></h2><div class="panel">${rows}</div></section>`;
}

function top(obj, n) {
  return Object.entries(obj)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
}

/** The "how scoring works" panel — formulas laid out explicitly. */
function scoringMethod(lang, t) {
  const step = (title, body, formula) => `<div class="score-step">
    <h4>${esc(lang === 'ja' ? title.ja : title.en)}</h4>
    ${formula ? `<div class="formula">${formula}</div>` : ''}
    <p>${esc(lang === 'ja' ? body.ja : body.en)}</p>
  </div>`;

  const rarityRows = RARITY_TIERS.map((r, i) => {
    // RARITY_TIERS is ordered high→low; the next higher tier sits at i-1.
    const hi = i === 0 ? 99 : RARITY_TIERS[i - 1].minLevel - 1;
    const range = r.minLevel === 0 ? `1–${hi}` : `${r.minLevel}–${hi}`;
    return `<tr>
      <td><b class="tier">${esc(r.id)}</b> <span class="dim">${esc(lang === 'ja' ? r.ja : r.en)}</span></td>
      <td class="stars">${'★'.repeat(r.stars)}<span class="dim">${'★'.repeat(5 - r.stars)}</span></td>
      <td class="num">Lv ${range}</td>
    </tr>`;
  }).join('');

  return `<section>
    <h2>${icon('gauge', 15)}<span>${esc(t('scoringHeading'))}</span></h2>
    <div class="panel score-panel">
      <p class="score-intro">${esc(t('scoringIntro'))}</p>
      <div class="score-grid">
        ${step(
          { ja: t('scoringSatTitle'), en: t('scoringSatTitle') },
          { ja: t('scoringSatBody'), en: t('scoringSatBody') },
          `points = 100 · <span class="v">x</span> / (<span class="v">x</span> + <span class="v">h</span>)`
        )}
        ${step(
          { ja: t('scoringAxisTitle'), en: t('scoringAxisTitle') },
          { ja: t('scoringAxisBody'), en: t('scoringAxisBody') },
          `axis = Σ ( <span class="v">wᵢ</span> · pointsᵢ )`
        )}
        ${step(
          { ja: t('scoringLevelTitle'), en: t('scoringLevelTitle') },
          { ja: t('scoringLevelBody'), en: t('scoringLevelBody') },
          `Lv = round( 99 · (S/100)<sup>${LEVEL_GAMMA}</sup> )`
        )}
        ${step(
          { ja: t('scoringDevTitle'), en: t('scoringDevTitle') },
          { ja: t('scoringDevBody'), en: t('scoringDevBody') },
          `dev = 50 + 10 · (S − ${BASELINE.mean}) / ${BASELINE.sd}`
        )}
      </div>
      <div class="rarity-block">
        <h4>${esc(t('scoringRarityTitle'))}</h4>
        <p>${esc(t('scoringRarityBody'))}</p>
        <table class="rarity-table">
          <thead><tr><th>${esc(t('colTier'))}</th><th>${esc(t('colStars'))}</th><th class="num">${esc(t('colLevelRange'))}</th></tr></thead>
          <tbody>${rarityRows}</tbody>
        </table>
      </div>
    </div>
  </section>`;
}

/** data = { score, sessions, lang, t } */
export function renderDashboard(data) {
  const { score, sessions, lang, t } = data;
  return `
  <div class="privacy-banner">${icon('shield', 15)}<span>${esc(t('privacyBanner'))}</span></div>
  ${breakdownTables(score, lang, t)}
  ${heatmap(sessions.dayCounts ?? {}, lang, t)}
  ${barList(top(sessions.toolUse ?? {}, 15), t('toolsHeading'), 'wrench')}
  ${barList(top(sessions.attributionSkills ?? {}, 15), t('skillsHeading'), 'zap')}
  ${barList(top(sessions.models ?? {}, 8), t('modelsHeading'), 'cpu')}
  ${scoringMethod(lang, t)}
  `;
}
