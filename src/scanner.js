import { promises as fs } from 'node:fs';
import { existsSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';

/** Count entries in a directory, with an optional filter on the dirent. */
async function countEntries(dir, filter = () => true) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries.filter((e) => !e.name.startsWith('.') && filter(e)).length;
  } catch {
    return 0;
  }
}

async function fileSize(path) {
  try {
    return (await fs.stat(path)).size;
  } catch {
    return 0;
  }
}

const isMd = (e) => e.isFile() && e.name.endsWith('.md');
// A skill can be a directory (containing SKILL.md) or a bare .md file.
const isSkillEntry = (e) => e.isDirectory() || isMd(e);

/** Parse settings.json into countable metrics. Missing file / broken JSON → zeros. */
async function scanSettings(claudeDir) {
  const out = {
    permissionsAllow: 0,
    permissionsAsk: 0,
    permissionsDeny: 0,
    hookEvents: 0,
    hookBlocks: 0,
    plugins: 0,
    mcpServers: 0,
    hasStatusLine: false,
  };
  try {
    const raw = await fs.readFile(join(claudeDir, 'settings.json'), 'utf8');
    const s = JSON.parse(raw);
    out.permissionsAllow = s.permissions?.allow?.length ?? 0;
    out.permissionsAsk = s.permissions?.ask?.length ?? 0;
    out.permissionsDeny = s.permissions?.deny?.length ?? 0;
    if (s.hooks && typeof s.hooks === 'object') {
      const events = Object.keys(s.hooks);
      out.hookEvents = events.length;
      out.hookBlocks = events.reduce(
        (n, ev) => n + (Array.isArray(s.hooks[ev]) ? s.hooks[ev].length : 1),
        0
      );
    }
    if (s.enabledPlugins && typeof s.enabledPlugins === 'object') {
      out.plugins = Array.isArray(s.enabledPlugins)
        ? s.enabledPlugins.length
        : Object.values(s.enabledPlugins).filter(Boolean).length;
    }
    if (s.mcpServers && typeof s.mcpServers === 'object') {
      out.mcpServers = Object.keys(s.mcpServers).length;
    }
    out.hasStatusLine = Boolean(s.statusLine);
  } catch {
    // absent or unparsable settings.json is fine (fresh install)
  }
  return out;
}

/** Count settings.json backup generations (settings.json.bak*, *.bak-*, backups/). */
async function countSettingsBackups(claudeDir) {
  let count = 0;
  try {
    const entries = await fs.readdir(claudeDir);
    count += entries.filter(
      (n) => n.startsWith('settings.json.') && n !== 'settings.json.lock'
    ).length;
  } catch {
    /* ignore */
  }
  count += await countEntries(join(claudeDir, 'backups'));
  return count;
}

const FEEDBACK_RE = /^feedback[-_]/i;
const REFERENCE_RE = /^reference[-_]/i;

/**
 * Scan projects/<encoded>/memory/*.md across all projects.
 * Returns { total, feedback, reference }.
 */
async function scanMemory(projectsDir, projectDirs) {
  const out = { total: 0, feedback: 0, reference: 0 };
  for (const name of projectDirs) {
    let files;
    try {
      files = await fs.readdir(join(projectsDir, name, 'memory'));
    } catch {
      continue;
    }
    for (const f of files) {
      if (!f.endsWith('.md')) continue;
      out.total += 1;
      if (FEEDBACK_RE.test(f)) out.feedback += 1;
      else if (REFERENCE_RE.test(f)) out.reference += 1;
    }
  }
  return out;
}

/**
 * Decode a projects/ directory name (path with `/` replaced by `-`) back to a
 * filesystem path. The encoding is lossy for paths containing hyphens, so the
 * naive decode is verified with existsSync and dropped on mismatch.
 */
export function decodeProjectDir(name) {
  if (!name.startsWith('-')) return null;
  const candidate = name.replaceAll('-', sep);
  return existsSync(candidate) ? candidate : null;
}

/**
 * Scan project-level .claude/ dirs and CLAUDE.md for every decodable project.
 * Uses sync stat on a deduped set of repo roots (small N, avoids async fan-out).
 */
async function scanProjectLevel(projectDirs) {
  const roots = new Set();
  for (const name of projectDirs) {
    const decoded = decodeProjectDir(name);
    if (decoded) roots.add(decoded);
  }
  const out = { repos: roots.size, agents: 0, skills: 0, commands: 0, claudeMdBytes: 0 };
  for (const root of roots) {
    out.agents += await countEntries(join(root, '.claude', 'agents'), isMd);
    out.skills += await countEntries(join(root, '.claude', 'skills'), isSkillEntry);
    out.commands += await countEntries(join(root, '.claude', 'commands'), isMd);
    try {
      out.claudeMdBytes += statSync(join(root, 'CLAUDE.md')).size;
    } catch {
      /* no CLAUDE.md */
    }
  }
  return out;
}

/**
 * Inventory everything in the Claude config dir except session JSONL contents.
 * Every probe tolerates absence (fresh installs score low, not crash).
 */
export async function scanFs(claudeDir) {
  const projectsDir = join(claudeDir, 'projects');
  let projectDirs = [];
  try {
    projectDirs = (await fs.readdir(projectsDir, { withFileTypes: true }))
      .filter((e) => e.isDirectory())
      .map((e) => e.name);
  } catch {
    /* no projects yet */
  }

  const [
    skills,
    commands,
    agents,
    hooksScripts,
    rules,
    outputStyles,
    plans,
    settings,
    settingsBackups,
    memory,
    projectLevel,
    globalClaudeMdBytes,
  ] = await Promise.all([
    countEntries(join(claudeDir, 'skills'), isSkillEntry),
    countEntries(join(claudeDir, 'commands'), isMd),
    countEntries(join(claudeDir, 'agents'), isMd),
    countEntries(join(claudeDir, 'hooks'), (e) => e.isFile()),
    countEntries(join(claudeDir, 'rules'), isMd),
    countEntries(join(claudeDir, 'output-styles')),
    countEntries(join(claudeDir, 'plans')),
    scanSettings(claudeDir),
    countSettingsBackups(claudeDir),
    scanMemory(projectsDir, projectDirs),
    scanProjectLevel(projectDirs),
    fileSize(join(claudeDir, 'CLAUDE.md')),
  ]);

  return {
    skills,
    commands,
    agents,
    hooksScripts,
    rules,
    outputStyles,
    plans,
    settings,
    settingsBackups,
    memory,
    projectLevel,
    claudeMdKb: Math.round((globalClaudeMdBytes + projectLevel.claudeMdBytes) / 1024),
    projectCount: projectDirs.length,
  };
}
