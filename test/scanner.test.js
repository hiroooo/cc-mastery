import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { scanFs, decodeProjectDir } from '../src/scanner.js';

const FIXTURE = fileURLToPath(new URL('./fixtures/fake-claude', import.meta.url));

test('scanFs counts fixture inventory', async () => {
  const m = await scanFs(FIXTURE);
  assert.equal(m.skills, 3); // 2 dirs + 1 bare .md
  assert.equal(m.commands, 2);
  assert.equal(m.agents, 1);
  assert.equal(m.hooksScripts, 1);
  assert.equal(m.rules, 1);
  assert.equal(m.outputStyles, 0);
  assert.equal(m.plans, 2);
  assert.equal(m.projectCount, 1);
  assert.equal(m.settingsBackups, 1);
  assert.ok(m.claudeMdKb >= 0);
});

test('scanFs parses settings.json', async () => {
  const m = await scanFs(FIXTURE);
  assert.equal(m.settings.permissionsAllow, 5);
  assert.equal(m.settings.permissionsAsk, 1);
  assert.equal(m.settings.hookEvents, 2);
  assert.equal(m.settings.hookBlocks, 3);
  assert.equal(m.settings.plugins, 1); // only truthy enabledPlugins count
  assert.equal(m.settings.mcpServers, 1);
  assert.equal(m.settings.hasStatusLine, true);
});

test('scanFs classifies memory files (hyphen + underscore prefixes)', async () => {
  const m = await scanFs(FIXTURE);
  assert.equal(m.memory.total, 5);
  assert.equal(m.memory.feedback, 2); // feedback-x.md + feedback_y.md
  assert.equal(m.memory.reference, 1);
});

test('scanFs tolerates a completely empty dir (fresh install)', async () => {
  const m = await scanFs('/nonexistent-cc-mastery-test-dir');
  assert.equal(m.skills, 0);
  assert.equal(m.memory.total, 0);
  assert.equal(m.settings.permissionsAllow, 0);
  assert.equal(m.projectCount, 0);
});

test('decodeProjectDir drops non-existent decoded paths', () => {
  assert.equal(decodeProjectDir('-fake-nonexistent-proj'), null);
  assert.equal(decodeProjectDir('not-encoded'), null);
});
