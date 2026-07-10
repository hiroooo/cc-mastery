/**
 * Title table. Rules are evaluated top-down, first match wins.
 * ctx = { axes: {customization, agentification, automation, pdca, volume}, level }
 */

const AXIS_TITLES = {
  agentification: { ja: '司令塔アーキテクト', en: 'The Orchestrator' },
  customization: { ja: '魔改造の匠', en: 'The Tinkerer' },
  automation: { ja: '全自動の錬金術師', en: 'The Automaton' },
  pdca: { ja: '改善の求道者', en: 'The Kaizen Sage' },
  volume: { ja: '不眠の開拓者', en: 'The Grinder' },
};

function ranked(axes) {
  return Object.entries(axes).sort((a, b) => b[1] - a[1]);
}

export const TITLE_RULES = [
  {
    id: 'ascended',
    ja: 'Claude Code の化身',
    en: 'The Ascended',
    match: ({ axes }) => Object.values(axes).every((s) => s >= 70),
  },
  {
    id: 'apprentice',
    ja: '見習い冒険者',
    en: 'The Apprentice',
    match: ({ level }) => level < 15,
  },
  {
    id: 'wanderer',
    ja: '駆け出しの旅人',
    en: 'The Wanderer',
    match: ({ axes, level }) => {
      const [first, second] = ranked(axes);
      return level < 30 && first[1] - second[1] < 8;
    },
  },
  {
    id: 'dominant',
    match: ({ axes }) => {
      const [first, second] = ranked(axes);
      return first[1] - second[1] >= 8;
    },
    resolve: ({ axes }) => {
      const [first] = ranked(axes);
      return { id: `dominant-${first[0]}`, ...AXIS_TITLES[first[0]] };
    },
  },
  {
    id: 'dual-wielder',
    ja: '二刀流の実践者',
    en: 'The Dual Wielder',
    match: ({ axes }) => {
      const [first, second] = ranked(axes);
      return first[1] - second[1] < 5 && first[1] >= 50 && second[1] >= 50;
    },
  },
  {
    id: 'pathfinder',
    ja: '万能の探索者',
    en: 'The Pathfinder',
    match: () => true,
  },
];

/**
 * Resolve the title for a score result.
 * scoreResult = computeScores() output.
 * Returns { id, ja, en }.
 */
export function resolveTitle(scoreResult) {
  const axes = Object.fromEntries(scoreResult.axes.map((a) => [a.key, a.score]));
  const ctx = { axes, level: scoreResult.level };
  for (const rule of TITLE_RULES) {
    if (rule.match(ctx)) {
      return rule.resolve ? rule.resolve(ctx) : { id: rule.id, ja: rule.ja, en: rule.en };
    }
  }
  // unreachable: pathfinder matches everything
  return { id: 'pathfinder', ja: '万能の探索者', en: 'The Pathfinder' };
}
