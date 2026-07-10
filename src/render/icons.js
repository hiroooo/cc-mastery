/**
 * Minimal inline icon set (hand-drawn, 24×24 viewBox, stroke-based).
 * Inlined so the report stays fully self-contained — no CDN, no @font-face,
 * no network. `stroke="currentColor"` lets CSS color them.
 */

const PATHS = {
  // lightning bolt — skills
  zap: '<path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H12L13 2z"/>',
  // robot head — agents
  bot: '<rect x="5" y="9" width="14" height="10" rx="2.5"/><path d="M12 9V5"/><circle cx="12" cy="4" r="1.4"/><circle cx="9.2" cy="14" r="1.2" fill="currentColor" stroke="none"/><circle cx="14.8" cy="14" r="1.2" fill="currentColor" stroke="none"/>',
  // anchor — hooks (reads cleanly at 14px, unlike a fishhook)
  hook: '<circle cx="12" cy="5.5" r="2.5"/><path d="M12 8v12M5 13H3a9 9 0 0 0 18 0h-2"/>',
  // terminal prompt — sessions
  terminal: '<path d="M5 7l5 5-5 5M12 17h7"/>',
  // calendar — active days
  calendar: '<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
  // open book — memory
  book: '<path d="M12 6c-1.5-1.5-4-2-7-2v14c3 0 5.5.5 7 2 1.5-1.5 4-2 7-2V4c-3 0-5.5.5-7 2v14"/>',
  // gauge — deviation
  gauge: '<path d="M4 15a8 8 0 0 1 16 0"/><path d="M12 15l4-5"/><circle cx="12" cy="15" r="1.5"/>',
  // wrench — tools
  wrench: '<path d="M14 3a5.4 5.4 0 0 0-5 7.4L3.5 16A2.1 2.1 0 0 0 6.5 19L12 13.6A5.4 5.4 0 0 0 19.4 8L16 11.4 11.6 7 15 3.6A5.4 5.4 0 0 0 14 3z"/>',
  // cpu — models
  cpu: '<rect x="7" y="7" width="10" height="10" rx="1.5"/><path d="M10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4"/>',
  // list/table — breakdown
  table: '<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M4 10h16M10 10v9"/>',
  // pulse — activity heatmap
  activity: '<path d="M3 12h4l2.5-6 5 12L17 12h4"/>',
  // download — save PNG
  download: '<path d="M12 4v11m0 0 4-4m-4 4-4-4M5 20h14"/>',
  // lock — local only
  lock: '<rect x="6" y="11" width="12" height="9" rx="2"/><path d="M9 11V7a3 3 0 0 1 6 0v4"/>',
  // shield-alert — privacy banner
  shield: '<path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6l7-3z"/><path d="M12 8v4"/><circle cx="12" cy="15" r="0.8" fill="currentColor" stroke="none"/>',
  // crossed swords — card header
  swords: '<path d="M4 4l10.5 10.5M20 4L9.5 14.5M4 20l4-4M20 20l-4-4M6.5 17.5l-2 2M17.5 17.5l2 2"/>',
};

/** Inline SVG icon. size in px, colored via currentColor. */
export function icon(name, size = 18, extraAttrs = '') {
  const body = PATHS[name];
  if (!body) return '';
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extraAttrs}>${body}</svg>`;
}

/** Same paths for use INSIDE the card SVG (as a positioned <g>). */
export function svgIcon(name, x, y, size, color, strokeWidth = 2) {
  const body = PATHS[name];
  if (!body) return '';
  const s = size / 24;
  return `<g transform="translate(${x},${y}) scale(${s})" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${body}</g>`;
}

export const STAT_ICONS = ['zap', 'bot', 'hook', 'terminal', 'calendar', 'book'];
