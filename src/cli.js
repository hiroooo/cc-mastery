import { parseArgs } from 'node:util';
import { promises as fs } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveClaudeDir, resolveCacheDir } from './config.js';
import { scanFs } from './scanner.js';
import { scanSessions } from './jsonl.js';
import { computeScores } from './scorer.js';
import { resolveTitle } from './titles.js';
import { makeT, detectLang } from './i18n.js';
import { renderHtml } from './render/html.js';
import { openInBrowser } from './open.js';

const HELP = `cc-mastery — how deeply have you mastered Claude Code?

Scans your local ~/.claude and renders an RPG-style mastery card.
Everything runs locally; nothing is ever sent anywhere.

Usage: npx cc-mastery [options]

Options:
  --lang <ja|en>       Card/report language (default: from $LANG)
  --output <path>      HTML output path (default: ./cc-mastery-report.html)
  --json               Print scores + metrics as JSON to stdout (no HTML)
  --no-open            Do not open the report in a browser
  --project <name>     Restrict session analysis to one project (substring match)
  --claude-dir <path>  Claude config dir (default: $CLAUDE_CONFIG_DIR or ~/.claude)
  --no-cache           Ignore the scan cache and rescan every session file
  --version            Print version
  --help               Show this help
`;

async function readVersion() {
  try {
    const pkgPath = fileURLToPath(new URL('../package.json', import.meta.url));
    return JSON.parse(await fs.readFile(pkgPath, 'utf8')).version;
  } catch {
    return '0.0.0';
  }
}

function bar(score, width = 20) {
  const filled = Math.round((score / 100) * width);
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

export async function run(argv = process.argv.slice(2)) {
  let args;
  try {
    ({ values: args } = parseArgs({
      args: argv,
      options: {
        lang: { type: 'string' },
        output: { type: 'string' },
        json: { type: 'boolean', default: false },
        'no-open': { type: 'boolean', default: false },
        project: { type: 'string' },
        'claude-dir': { type: 'string' },
        'no-cache': { type: 'boolean', default: false },
        version: { type: 'boolean', default: false },
        help: { type: 'boolean', default: false },
      },
      strict: true,
    }));
  } catch (err) {
    process.stderr.write(`${err.message}\n\n${HELP}`);
    return 1;
  }

  const version = await readVersion();
  if (args.help) {
    process.stdout.write(HELP);
    return 0;
  }
  if (args.version) {
    process.stdout.write(`${version}\n`);
    return 0;
  }

  const lang = args.lang === 'ja' || args.lang === 'en' ? args.lang : detectLang();
  const t = makeT(lang);
  const claudeDir = resolveClaudeDir(args['claude-dir']);
  const cacheDir = resolveCacheDir();
  const quietStdout = args.json; // keep stdout JSON-clean
  const log = (msg) => process.stderr.write(msg);

  try {
    await fs.access(claudeDir);
  } catch {
    process.stderr.write(`cc-mastery: Claude config dir not found: ${claudeDir}\n`);
    process.stderr.write('Is Claude Code installed? (Set CLAUDE_CONFIG_DIR or pass --claude-dir.)\n');
    return 1;
  }

  const started = Date.now();
  log(`Scanning ${claudeDir} …\n`);

  let lastRender = 0;
  const onProgress = (done, total, cached) => {
    const now = Date.now();
    if (now - lastRender < 80 && done !== total) return;
    lastRender = now;
    log(`\r  sessions ${done}/${total} (${cached} cached)   `);
  };

  const [fsMetrics, sessionScan] = await Promise.all([
    scanFs(claudeDir),
    scanSessions(claudeDir, {
      cacheDir,
      noCache: args['no-cache'],
      projectFilter: args.project,
      onProgress,
    }),
  ]);
  if (sessionScan.fileCount > 0) log('\n');

  const raw = { fs: fsMetrics, sessions: sessionScan.metrics };
  const score = computeScores(raw);
  const title = resolveTitle(score);
  const elapsed = ((Date.now() - started) / 1000).toFixed(1);
  log(`Done in ${elapsed}s\n\n`);

  if (args.json) {
    process.stdout.write(
      `${JSON.stringify({ version, generatedAt: new Date().toISOString(), score, title, metrics: raw }, null, 2)}\n`
    );
    return 0;
  }

  const stats = [
    { label: t('statSkills'), value: fsMetrics.skills + fsMetrics.projectLevel.skills },
    { label: t('statAgents'), value: fsMetrics.agents + fsMetrics.projectLevel.agents },
    { label: t('statHooks'), value: fsMetrics.hooksScripts },
    { label: t('statSessions'), value: sessionScan.metrics.sessionCount },
    { label: t('statActiveDays'), value: sessionScan.metrics.activeDays },
    { label: t('statMemory'), value: fsMetrics.memory.total },
  ];

  const html = renderHtml({
    score,
    title,
    stats,
    sessions: sessionScan.metrics,
    lang,
    t,
    generatedAt: new Date().toISOString().slice(0, 10),
    version,
  });

  const outPath = resolve(args.output ?? 'cc-mastery-report.html');
  await fs.writeFile(outPath, html);

  // terminal summary
  const titleText = lang === 'ja' ? `${title.ja} / ${title.en}` : title.en;
  const lines = [
    '',
    `  ⚔  Lv ${score.level}  —  ${titleText}`,
    `     ${t('deviation')}: ${score.deviation}`,
    '',
    ...score.axes.map((a) => {
      const label = (lang === 'ja' ? a.ja : a.en).padEnd(lang === 'ja' ? 7 : 12, '　');
      return `     ${label} ${bar(a.score)} ${Math.round(a.score)}`;
    }),
    '',
    `  → ${outPath}`,
    '',
  ];
  if (!quietStdout) process.stdout.write(`${lines.join('\n')}\n`);

  if (!args['no-open']) openInBrowser(outPath);
  return 0;
}
