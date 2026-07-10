/**
 * Detail dashboard (local viewing only — this section DOES show skill /
 * project / model names, behind an explicit "don't screenshot this" banner).
 */

import { icon } from './icons.js';

function esc(s) {
  return String(s).replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
}

function fmt(n) {
  return Number(n).toLocaleString('en-US');
}

// sequential blue ramp on the dark surface (low → high)
const HEAT_STEPS = ['#184f95', '#256abf', '#3987e5', '#86b6ef'];

function heatmap(dayCounts, t) {
  const DAY_MS = 24 * 60 * 60 * 1000;
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
  for (let ws = new Date(start); ws <= today; ws = new Date(ws.getTime() + 7 * DAY_MS)) {
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
  }
  return `<section>
    <h2>${icon('activity')} ${esc(t('heatmapHeading'))}</h2>
    <div class="hm-scroll"><div class="hm-grid">${cols.join('')}</div></div>
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
        <td class="num">${m.h == null ? '—' : fmt(m.h)}</td>
        <td class="num">${m.w.toFixed(2)}</td>
        <td class="num strong">${m.points}</td>
      </tr>`
        )
        .join('');
      return `<div class="axis-table">
      <h3>${esc(lang === 'ja' ? axis.ja : axis.en)} <span class="axis-score">${Math.round(axis.score)}</span></h3>
      <table>
        <thead><tr><th>${esc(t('colMetric'))}</th><th class="num">${esc(t('colValue'))}</th><th class="num">${esc(t('colHalf'))}</th><th class="num">${esc(t('colWeight'))}</th><th class="num">${esc(t('colPoints'))}</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
    })
    .join('');
  return `<section><h2>${icon('table')} ${esc(t('breakdownHeading'))}</h2><div class="axis-grid">${sections}</div></section>`;
}

function barList(entries, heading, iconName) {
  if (entries.length === 0) return '';
  const max = Math.max(...entries.map(([, v]) => v));
  const rows = entries
    .map(
      ([name, v]) => `<div class="bar-row">
      <div class="bar-label" title="${esc(name)}">${esc(name)}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${((100 * v) / max).toFixed(1)}%"></div></div>
      <div class="bar-value">${fmt(v)}</div>
    </div>`
    )
    .join('');
  return `<section><h2>${icon(iconName)} ${esc(heading)}</h2><div class="bars">${rows}</div></section>`;
}

function top(obj, n) {
  return Object.entries(obj)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
}

/** data = { score, sessions, lang, t } */
export function renderDashboard(data) {
  const { score, sessions, lang, t } = data;
  return `
  <div class="privacy-banner">${icon('shield', 16)}${esc(t('privacyBanner'))}</div>
  <h1 class="dash-title">${esc(t('dashboardTitle'))}</h1>
  ${breakdownTables(score, lang, t)}
  ${heatmap(sessions.dayCounts ?? {}, t)}
  ${barList(top(sessions.toolUse ?? {}, 15), t('toolsHeading'), 'wrench')}
  ${barList(top(sessions.attributionSkills ?? {}, 15), t('skillsHeading'), 'zap')}
  ${barList(top(sessions.models ?? {}, 8), t('modelsHeading'), 'cpu')}
  `;
}
