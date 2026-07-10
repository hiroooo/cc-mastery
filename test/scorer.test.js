import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sat, computeScores, AXES, BASELINE } from '../src/scorer.js';

test('sat() boundaries', () => {
  assert.equal(sat(0, 10), 0);
  assert.equal(sat(-5, 10), 0);
  assert.equal(sat(10, 10), 50); // x = h → exactly 50
  assert.ok(sat(1000000, 10) < 100); // never saturates
  assert.ok(sat(3, 12) > 15); // beginners don't flatline
});

test('axis weights sum to 1.0', () => {
  for (const axis of AXES) {
    const sum = axis.metrics.reduce((s, m) => s + m.w, 0);
    assert.ok(Math.abs(sum - 1) < 1e-9, `${axis.key} weights sum to ${sum}`);
  }
});

function emptyRaw() {
  return {
    fs: {
      skills: 0, commands: 0, agents: 0, hooksScripts: 0, rules: 0,
      outputStyles: 0, plans: 0, settingsBackups: 0, claudeMdKb: 0, projectCount: 0,
      settings: {
        permissionsAllow: 0, permissionsAsk: 0, permissionsDeny: 0,
        hookEvents: 0, hookBlocks: 0, plugins: 0, mcpServers: 0, hasStatusLine: false,
      },
      memory: { total: 0, feedback: 0, reference: 0 },
      projectLevel: { repos: 0, agents: 0, skills: 0, commands: 0, claudeMdBytes: 0 },
    },
    sessions: {
      sessionCount: 0, sessionProjects: 0, activeDays: 0, activeDaysLast30: 0,
      sidechainSessions: 0, hookCountSum: 0, attributionSkillLines: 0,
      agentToolUses: 0, outputTokens: 0, inputTokens: 0, cacheReadTokens: 0,
      toolUse: {}, attributionSkills: {}, models: {}, dayCounts: {}, days: [],
    },
  };
}

test('empty environment scores zero, Lv 1, deviation from baseline', () => {
  const s = computeScores(emptyRaw());
  assert.equal(s.total, 0);
  assert.equal(s.level, 1);
  assert.equal(s.deviation, Math.round(50 - (10 * BASELINE.mean) / BASELINE.sd));
  for (const a of s.axes) assert.equal(a.score, 0);
});

test('power-user-ish raw yields high but non-saturated scores', () => {
  const raw = emptyRaw();
  raw.fs.skills = 80;
  raw.fs.commands = 57;
  raw.fs.agents = 23;
  raw.fs.hooksScripts = 21;
  raw.fs.plans = 16;
  raw.fs.settingsBackups = 5;
  raw.fs.claudeMdKb = 30;
  raw.fs.rules = 4;
  raw.fs.projectCount = 67;
  raw.fs.settings = {
    permissionsAllow: 77, permissionsAsk: 9, permissionsDeny: 0,
    hookEvents: 8, hookBlocks: 10, plugins: 7, mcpServers: 3, hasStatusLine: true,
  };
  raw.fs.memory = { total: 999, feedback: 400, reference: 250 };
  raw.fs.projectLevel = { repos: 20, agents: 18, skills: 7, commands: 36, claudeMdBytes: 0 };
  raw.sessions.sessionCount = 2169;
  raw.sessions.activeDays = 150;
  raw.sessions.activeDaysLast30 = 28;
  raw.sessions.agentToolUses = 1500;
  raw.sessions.sidechainSessions = 400;
  raw.sessions.hookCountSum = 50000;
  raw.sessions.attributionSkillLines = 800;
  raw.sessions.outputTokens = 200e6;

  const s = computeScores(raw);
  assert.ok(s.total > 70, `total ${s.total} should exceed 70`);
  assert.ok(s.total < 100);
  assert.ok(s.level >= 70 && s.level <= 99, `level ${s.level}`);
  assert.ok(s.deviation > 65, `deviation ${s.deviation}`);
  for (const a of s.axes) assert.ok(a.score > 50 && a.score < 100, `${a.key}=${a.score}`);
});

test('beginner raw does not flatline at zero', () => {
  const raw = emptyRaw();
  raw.fs.skills = 3;
  raw.fs.commands = 1;
  raw.sessions.sessionCount = 20;
  raw.sessions.activeDays = 10;
  raw.sessions.activeDaysLast30 = 5;
  raw.sessions.outputTokens = 0.5e6;
  raw.fs.projectCount = 2;

  const s = computeScores(raw);
  assert.ok(s.total > 3, `total ${s.total}`);
  assert.ok(s.level >= 5, `level ${s.level} should feel non-humiliating`);
});

test('breakdown is exposed for every metric (dashboard contract)', () => {
  const s = computeScores(emptyRaw());
  for (const axis of s.axes) {
    assert.ok(axis.breakdown.length >= 4);
    for (const m of axis.breakdown) {
      assert.ok('x' in m && 'points' in m && 'w' in m && 'ja' in m && 'en' in m);
    }
  }
});
