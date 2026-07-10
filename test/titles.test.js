import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveTitle } from '../src/titles.js';

function scoreResult(axes, level) {
  const keys = ['customization', 'agentification', 'automation', 'pdca', 'volume'];
  return {
    level,
    axes: keys.map((key, i) => ({ key, score: axes[i] })),
  };
}

test('all axes ≥ 70 → The Ascended', () => {
  const t = resolveTitle(scoreResult([80, 75, 70, 90, 72], 80));
  assert.equal(t.id, 'ascended');
});

test('level < 15 → The Apprentice', () => {
  const t = resolveTitle(scoreResult([10, 8, 5, 3, 12], 10));
  assert.equal(t.id, 'apprentice');
});

test('level < 30 with no dominant axis → The Wanderer', () => {
  const t = resolveTitle(scoreResult([25, 22, 20, 24, 23], 25));
  assert.equal(t.id, 'wanderer');
});

test('dominant axis titles (lead ≥ 8 over second place)', () => {
  const cases = [
    [[90, 40, 40, 40, 40], 'dominant-customization', '魔改造の匠'],
    [[40, 90, 40, 40, 40], 'dominant-agentification', '司令塔アーキテクト'],
    [[40, 40, 90, 40, 40], 'dominant-automation', '全自動の錬金術師'],
    [[40, 40, 40, 90, 40], 'dominant-pdca', '改善の求道者'],
    [[40, 40, 40, 40, 90], 'dominant-volume', '不眠の開拓者'],
  ];
  for (const [axes, id, ja] of cases) {
    const t = resolveTitle(scoreResult(axes, 60));
    assert.equal(t.id, id);
    assert.equal(t.ja, ja);
    assert.ok(t.en.startsWith('The '));
  }
});

test('two close high axes → The Dual Wielder', () => {
  const t = resolveTitle(scoreResult([68, 65, 40, 30, 35], 55));
  assert.equal(t.id, 'dual-wielder');
});

test('balanced mid-range → The Pathfinder', () => {
  // lead 6 (no dominant), second below 50 (no dual wielder), level ≥ 30
  const t = resolveTitle(scoreResult([52, 46, 40, 41, 44], 45));
  assert.equal(t.id, 'pathfinder');
});

test('every resolved title has both languages', () => {
  const t = resolveTitle(scoreResult([50, 50, 50, 50, 50], 50));
  assert.ok(t.ja.length > 0);
  assert.ok(t.en.length > 0);
});
