import { test } from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { scanFile, scanSessions } from '../src/jsonl.js';

const FIXTURE = fileURLToPath(new URL('./fixtures/fake-claude', import.meta.url));
const SESS1 = join(FIXTURE, 'projects', '-fake-nonexistent-proj', 'sess1.jsonl');

test('scanFile extracts per-file record', async () => {
  const r = await scanFile(SESS1);
  assert.deepEqual(r.days, ['2026-07-01', '2026-07-02', '2026-07-03']);
  assert.equal(r.sidechainLines, 1);
  assert.equal(r.hookCountSum, 3);
  assert.deepEqual(r.attributionSkills, { 'my-secret-skill': 1 });
  assert.deepEqual(r.toolUse, { Agent: 1 });
  assert.deepEqual(r.models, { 'claude-fable-5': 2 });
  assert.equal(r.inputTokens, 120);
  assert.equal(r.cacheReadTokens, 1000);
});

test('token counts ignore usage.iterations (double-count regression)', async () => {
  // sess1 line 2 has usage.output_tokens=50 AND iterations[0].output_tokens=50.
  // A regex-based extractor would report 100; the parsed value must be 50 (+10 from line 3).
  const r = await scanFile(SESS1);
  assert.equal(r.outputTokens, 60);
});

test('scanSessions merges files and caches by size+mtime', async () => {
  const cacheDir = await fs.mkdtemp(join(tmpdir(), 'cc-mastery-test-'));
  try {
    const first = await scanSessions(FIXTURE, { cacheDir });
    assert.equal(first.fileCount, 4); // 2 sessions + 1 subagent + 1 workflow agent
    assert.equal(first.cachedCount, 0);
    const m = first.metrics;
    assert.equal(m.sessionCount, 2); // nested transcripts are NOT sessions
    assert.equal(m.subagentTranscripts, 2);
    assert.equal(m.workflowAgents, 1);
    assert.equal(m.sidechainSessions, 1); // sess1 spawned subagents; sess2 did not
    assert.equal(m.activeDays, 4);
    assert.equal(m.outputTokens, 85); // 60 (sess1) + 5 (sess2) + 15 (agent) + 5 (wf)
    assert.equal(m.agentToolUses, 1);
    assert.deepEqual(m.dayCounts['2026-07-01'], 2); // both sessions touched 07-01
    assert.equal(m.hookCountSum, 3);
    assert.equal(m.attributionSkillLines, 1);

    // second run: everything served from cache, identical result
    const second = await scanSessions(FIXTURE, { cacheDir });
    assert.equal(second.cachedCount, 4);
    assert.deepEqual(second.metrics, first.metrics);

    // --no-cache bypasses
    const third = await scanSessions(FIXTURE, { cacheDir, noCache: true });
    assert.equal(third.cachedCount, 0);
    assert.deepEqual(third.metrics, first.metrics);
  } finally {
    await fs.rm(cacheDir, { recursive: true, force: true });
  }
});

test('scanSessions with projectFilter narrows the file set', async () => {
  const res = await scanSessions(FIXTURE, { projectFilter: 'no-such-project-xyz' });
  assert.equal(res.fileCount, 0);
  assert.equal(res.metrics.sessionCount, 0);
});
