/**
 * Scoring core. All metric definitions live in the AXES table below —
 * the dashboard breakdown view is generated from the same table, so tuning
 * happens in exactly one place.
 */

/**
 * Saturation curve (Michaelis-Menten): 0 at x=0, 50 at x=h, approaches 100.
 * Beginners don't flatline at 0; power users don't saturate at 100.
 */
export function sat(x, h) {
  if (!x || x <= 0) return 0;
  return (100 * x) / (x + h);
}

// Assumed score distribution for the *estimated* standard score (偏差値).
// v0.2 will replace this with a real opt-in distribution.
export const BASELINE = { mean: 35, sd: 15 };

export const AXES = [
  {
    key: 'customization',
    ja: '改造',
    en: 'Customize',
    metrics: [
      { key: 'skills', ja: 'スキル数', en: 'Skills', h: 12, w: 0.3, get: (m) => m.fs.skills + m.fs.projectLevel.skills },
      { key: 'commands', ja: 'コマンド数', en: 'Commands', h: 10, w: 0.2, get: (m) => m.fs.commands + m.fs.projectLevel.commands },
      { key: 'claudeMd', ja: 'CLAUDE.md 合計KB', en: 'CLAUDE.md total KB', h: 8, w: 0.15, get: (m) => m.fs.claudeMdKb },
      { key: 'rulesStyles', ja: 'rules + output-styles', en: 'Rules + output styles', h: 4, w: 0.1, get: (m) => m.fs.rules + m.fs.outputStyles },
      { key: 'permissions', ja: 'permissions 件数', en: 'Permission rules', h: 30, w: 0.1, get: (m) => m.fs.settings.permissionsAllow + m.fs.settings.permissionsAsk + m.fs.settings.permissionsDeny },
      { key: 'plugins', ja: 'プラグイン数', en: 'Plugins', h: 4, w: 0.1, get: (m) => m.fs.settings.plugins },
      { key: 'statusLine', ja: 'statusLine 設定', en: 'Status line', bool: true, w: 0.05, get: (m) => (m.fs.settings.hasStatusLine ? 1 : 0) },
    ],
  },
  {
    key: 'agentification',
    ja: 'エージェント化',
    en: 'Agents',
    metrics: [
      { key: 'agentDefs', ja: 'agent 定義数', en: 'Agent definitions', h: 6, w: 0.3, get: (m) => m.fs.agents + m.fs.projectLevel.agents },
      { key: 'agentUses', ja: 'subagent 起動累計', en: 'Subagent spawns', h: 300, w: 0.3, get: (m) => Math.max(m.sessions.agentToolUses, m.sessions.subagentTranscripts ?? 0) },
      { key: 'sidechainSessions', ja: 'subagent 含有セッション', en: 'Sessions w/ subagents', h: 80, w: 0.25, get: (m) => m.sessions.sidechainSessions },
      { key: 'mcp', ja: 'MCP サーバー数', en: 'MCP servers', h: 3, w: 0.15, get: (m) => m.fs.settings.mcpServers },
    ],
  },
  {
    key: 'automation',
    ja: '自動化',
    en: 'Automation',
    metrics: [
      { key: 'hookScripts', ja: 'hook スクリプト数', en: 'Hook scripts', h: 6, w: 0.25, get: (m) => m.fs.hooksScripts },
      { key: 'hookEvents', ja: 'hook イベント種 (/9)', en: 'Hook event coverage (/9)', linearMax: 9, w: 0.25, get: (m) => m.fs.settings.hookEvents },
      { key: 'hookBlocks', ja: 'hook 設定ブロック数', en: 'Hook config blocks', h: 8, w: 0.15, get: (m) => m.fs.settings.hookBlocks },
      { key: 'hookRuns', ja: 'hook 実行累計', en: 'Hook executions', h: 5000, w: 0.25, get: (m) => m.sessions.hookCountSum },
      { key: 'skillFires', ja: 'スキル発火回数', en: 'Skill activations', h: 200, w: 0.1, get: (m) => m.sessions.attributionSkillLines },
    ],
  },
  {
    key: 'pdca',
    ja: 'PDCA',
    en: 'PDCA',
    metrics: [
      { key: 'memoryTotal', ja: 'memory ファイル総数', en: 'Memory notes', h: 100, w: 0.25, get: (m) => m.fs.memory.total },
      { key: 'memoryFeedback', ja: 'feedback 系 memory', en: 'Feedback notes', h: 40, w: 0.3, get: (m) => m.fs.memory.feedback },
      { key: 'memoryReference', ja: 'reference 系 memory', en: 'Reference notes', h: 30, w: 0.15, get: (m) => m.fs.memory.reference },
      { key: 'plans', ja: 'plan ファイル数', en: 'Plan files', h: 12, w: 0.15, get: (m) => m.fs.plans },
      { key: 'settingsBackups', ja: '設定バックアップ世代', en: 'Settings backups', h: 3, w: 0.15, get: (m) => m.fs.settingsBackups },
    ],
  },
  {
    // NOTE: Claude Code prunes transcripts after ~30 days by default
    // (cleanupPeriodDays), so JSONL-derived volume metrics only see the
    // retention window. The h values below are tuned for that window.
    key: 'volume',
    ja: '稼働量',
    en: 'Volume',
    metrics: [
      { key: 'activeDays', ja: 'アクティブ日数 (保持期間内)', en: 'Active days (retained)', h: 20, w: 0.3, get: (m) => m.sessions.activeDays },
      { key: 'sessions', ja: 'セッション数', en: 'Sessions', h: 150, w: 0.2, get: (m) => m.sessions.sessionCount },
      { key: 'outputMTokens', ja: '出力トークン (百万)', en: 'Output tokens (M)', h: 10, w: 0.2, get: (m) => m.sessions.outputTokens / 1e6 },
      { key: 'projects', ja: 'プロジェクト数', en: 'Projects', h: 20, w: 0.15, get: (m) => m.fs.projectCount },
      { key: 'activeDays30', ja: '直近30日アクティブ', en: 'Active days (30d)', h: 15, w: 0.15, get: (m) => m.sessions.activeDaysLast30 },
    ],
  },
];

function metricPoints(metric, x) {
  if (metric.bool) return x ? 100 : 0;
  if (metric.linearMax) return Math.min(100, (100 * x) / metric.linearMax);
  return sat(x, metric.h);
}

/**
 * Compute axis scores, total, level (1–99) and estimated standard score.
 * raw = { fs: <scanner.scanFs output>, sessions: <jsonl merged metrics> }
 */
export function computeScores(raw) {
  const axes = AXES.map((axis) => {
    let score = 0;
    const breakdown = axis.metrics.map((metric) => {
      const x = metric.get(raw);
      const points = metricPoints(metric, x);
      score += metric.w * points;
      return {
        key: metric.key,
        ja: metric.ja,
        en: metric.en,
        x: Math.round(x * 10) / 10,
        h: metric.h ?? null,
        w: metric.w,
        points: Math.round(points * 10) / 10,
      };
    });
    return {
      key: axis.key,
      ja: axis.ja,
      en: axis.en,
      score: Math.round(score * 10) / 10,
      breakdown,
    };
  });

  const total = axes.reduce((s, a) => s + a.score, 0) / axes.length;
  const level = Math.max(1, Math.round(99 * (total / 100) ** 0.9));
  const deviation = Math.round(50 + (10 * (total - BASELINE.mean)) / BASELINE.sd);

  return { axes, total: Math.round(total * 10) / 10, level, deviation };
}
