import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const exec = promisify(execFile);
const BIN = fileURLToPath(new URL('../bin/cc-mastery.js', import.meta.url));
const FIXTURE = fileURLToPath(new URL('./fixtures/fake-claude', import.meta.url));

async function runCli(args, extraEnv = {}) {
  const cacheHome = await fs.mkdtemp(join(tmpdir(), 'cc-mastery-cache-'));
  try {
    return await exec(process.execPath, [BIN, ...args], {
      env: { ...process.env, XDG_CACHE_HOME: cacheHome, ...extraEnv },
    });
  } finally {
    await fs.rm(cacheHome, { recursive: true, force: true });
  }
}

test('--json emits parseable scores on stdout only', async () => {
  const { stdout } = await runCli(['--claude-dir', FIXTURE, '--json', '--no-cache']);
  const parsed = JSON.parse(stdout);
  assert.ok(parsed.score.level >= 1);
  assert.equal(typeof parsed.score.deviation, 'number');
  assert.equal(parsed.score.axes.length, 5);
  assert.ok(parsed.title.ja && parsed.title.en);
  assert.equal(parsed.metrics.fs.skills, 3);
  assert.equal(parsed.metrics.sessions.sessionCount, 2);
});

test('HTML output mode writes the report and prints a summary', async () => {
  const outDir = await fs.mkdtemp(join(tmpdir(), 'cc-mastery-out-'));
  const outPath = join(outDir, 'report.html');
  try {
    const { stdout } = await runCli([
      '--claude-dir', FIXTURE, '--output', outPath, '--no-open', '--lang', 'en', '--no-cache',
    ]);
    const html = await fs.readFile(outPath, 'utf8');
    assert.ok(html.includes('id="card-svg"'));
    assert.ok(stdout.includes('Lv '));
    assert.ok(stdout.includes(outPath));
  } finally {
    await fs.rm(outDir, { recursive: true, force: true });
  }
});

test('--project with no match warns on stderr', async () => {
  const { stderr } = await runCli([
    '--claude-dir', FIXTURE, '--json', '--no-cache', '--project', 'no-such-project-xyz',
  ]);
  assert.match(stderr, /No session transcripts matched --project/);
});

test('--version and --help work', async () => {
  const v = await runCli(['--version']);
  assert.match(v.stdout.trim(), /^\d+\.\d+\.\d+$/);
  const h = await runCli(['--help']);
  assert.ok(h.stdout.includes('Usage:'));
});

test('missing claude dir exits non-zero with a hint', async () => {
  await assert.rejects(
    runCli(['--claude-dir', '/nonexistent-cc-mastery-dir', '--json']),
    (err) => {
      assert.equal(err.code, 1);
      assert.ok(err.stderr.includes('not found'));
      return true;
    }
  );
});

test('unknown flag exits non-zero with help', async () => {
  await assert.rejects(runCli(['--bogus']), (err) => {
    assert.equal(err.code, 1);
    assert.ok(err.stderr.includes('Usage:'));
    return true;
  });
});
