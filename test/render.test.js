import { test } from 'node:test';
import assert from 'node:assert/strict';
import { homedir } from 'node:os';
import { renderHtml } from '../src/render/html.js';
import { renderCardSvg } from '../src/render/card-svg.js';
import { computeScores } from '../src/scorer.js';
import { resolveTitle } from '../src/titles.js';
import { makeT } from '../src/i18n.js';

function sampleData(lang = 'ja') {
  const raw = {
    fs: {
      skills: 12, commands: 8, agents: 4, hooksScripts: 5, rules: 2,
      outputStyles: 0, plans: 6, settingsBackups: 2, claudeMdKb: 10, projectCount: 9,
      settings: {
        permissionsAllow: 20, permissionsAsk: 3, permissionsDeny: 0,
        hookEvents: 4, hookBlocks: 5, plugins: 2, mcpServers: 2, hasStatusLine: true,
      },
      memory: { total: 60, feedback: 25, reference: 15 },
      projectLevel: { repos: 3, agents: 2, skills: 1, commands: 4, claudeMdBytes: 0 },
    },
    sessions: {
      sessionCount: 300, sessionProjects: 9, activeDays: 80, activeDaysLast30: 12,
      sidechainSessions: 40, hookCountSum: 2000, attributionSkillLines: 90,
      agentToolUses: 150, outputTokens: 3e6, inputTokens: 10e6, cacheReadTokens: 50e6,
      toolUse: { Bash: 500, Read: 300, Agent: 150, 'my-secret-tool': 7 },
      attributionSkills: { 'my-secret-skill': 44, 'another-private-skill': 12 },
      models: { 'claude-fable-5': 100 },
      dayCounts: { '2026-07-01': 3, '2026-07-02': 1 },
      days: ['2026-07-01', '2026-07-02'],
    },
  };
  const score = computeScores(raw);
  const title = resolveTitle(score);
  const t = makeT(lang);
  return {
    score,
    title,
    stats: [
      { label: t('statSkills'), value: 13 },
      { label: t('statAgents'), value: 6 },
      { label: t('statHooks'), value: 5 },
      { label: t('statSessions'), value: 300 },
      { label: t('statActiveDays'), value: 80 },
      { label: t('statMemory'), value: 60 },
    ],
    sessions: raw.sessions,
    lang,
    t,
    generatedAt: '2026-07-10',
    version: '0.1.0',
  };
}

test('renderCardSvg produces a self-contained, canvas-exportable SVG', () => {
  const svg = renderCardSvg(sampleData());
  assert.ok(svg.startsWith('<svg'));
  assert.ok(svg.includes('xmlns="http://www.w3.org/2000/svg"'));
  assert.ok(/width="1200"/.test(svg));
  assert.ok(/height="675"/.test(svg));
  assert.ok(!svg.includes('<image'), 'no external images');
  // A data-URI @font-face is self-contained; only reject network references.
  assert.ok(!/url\(https?:/.test(svg), 'no external url() references');
  assert.ok(!/src\s*=\s*"https?:/.test(svg), 'no external src references');
  assert.ok(svg.includes('<polygon'), 'radar polygon present');
});

test('PRIVACY: card never contains names, paths, or model ids', () => {
  const data = sampleData();
  const svg = renderCardSvg(data);
  assert.ok(!svg.includes('my-secret-skill'), 'skill names must not leak into the card');
  assert.ok(!svg.includes('my-secret-tool'), 'tool names must not leak into the card');
  assert.ok(!svg.includes('claude-fable-5'), 'model ids must not leak into the card');
  assert.ok(!svg.includes('fake-nonexistent-proj'), 'project names must not leak');
  assert.ok(!svg.includes(homedir()), 'home path must not leak into the card');
});

test('renderHtml is a full document with card + dashboard + PNG button', () => {
  const html = renderHtml(sampleData());
  assert.ok(html.startsWith('<!doctype html>'));
  assert.ok(html.includes('id="card-svg"'));
  assert.ok(html.includes('id="save-png"'));
  assert.ok(html.includes('toDataURL'), 'PNG export script present');
  // scoring method is documented with the actual formulas
  assert.ok(html.includes('100 &#183; ') || html.includes('100 · '), 'sat formula shown');
  assert.ok(html.includes('(S/100)'), 'level formula shown');
  // dashboard (local-only section) DOES show names, behind the privacy banner
  assert.ok(html.includes('my-secret-skill'));
  const bannerIdx = html.indexOf('privacy-banner');
  const skillIdx = html.indexOf('my-secret-skill');
  assert.ok(bannerIdx !== -1 && bannerIdx < skillIdx, 'banner precedes named data');
});

test('language switch changes card strings', () => {
  const ja = renderHtml(sampleData('ja'));
  const en = renderHtml(sampleData('en'));
  assert.ok(ja.includes('推定偏差値'));
  assert.ok(en.includes('Est. std. score'));
  assert.ok(ja.includes('スキル'));
});

test('html escapes are applied to dashboard names', () => {
  const data = sampleData();
  data.sessions.toolUse['<script>alert(1)</script>'] = 3;
  const html = renderHtml(data);
  assert.ok(!html.includes('<script>alert(1)</script>'));
});
