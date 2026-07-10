import { createReadStream, promises as fs } from 'node:fs';
import { createInterface } from 'node:readline';
import { join, basename, sep } from 'node:path';
import { loadCache, saveCache, cacheHit } from './cache.js';

const CONCURRENCY = 8;

/**
 * Scan one session JSONL file into a per-file record (the cache unit).
 *
 * Performance strategy: cheap string probes decide which lines get JSON.parse.
 * Only assistant lines (usage/tool_use) and system lines carrying hookCount
 * are parsed. Token counts MUST come from the parsed object: `usage.iterations[]`
 * repeats the same key names, so regex extraction double-counts.
 */
export async function scanFile(path) {
  const rec = {
    days: new Set(),
    sidechainLines: 0,
    hookCountSum: 0,
    attributionSkills: {},
    toolUse: {},
    outputTokens: 0,
    inputTokens: 0,
    cacheReadTokens: 0,
    models: {},
  };

  const rl = createInterface({
    input: createReadStream(path, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    // timestamp → active-day set, without parsing (10-char date slice)
    const ti = line.indexOf('"timestamp":"');
    if (ti !== -1) rec.days.add(line.slice(ti + 13, ti + 23));

    if (line.includes('"isSidechain":true')) rec.sidechainLines += 1;

    const si = line.indexOf('"attributionSkill":"');
    if (si !== -1) {
      const end = line.indexOf('"', si + 20);
      if (end !== -1) {
        const skill = line.slice(si + 20, end);
        rec.attributionSkills[skill] = (rec.attributionSkills[skill] ?? 0) + 1;
      }
    }

    if (line.includes('"type":"assistant"')) {
      let obj;
      try {
        obj = JSON.parse(line);
      } catch {
        continue;
      }
      const msg = obj?.message;
      if (!msg) continue;
      if (msg.model) rec.models[msg.model] = (rec.models[msg.model] ?? 0) + 1;
      const u = msg.usage;
      if (u) {
        rec.outputTokens += u.output_tokens ?? 0;
        rec.inputTokens += u.input_tokens ?? 0;
        rec.cacheReadTokens += u.cache_read_input_tokens ?? 0;
      }
      if (Array.isArray(msg.content)) {
        for (const block of msg.content) {
          if (block?.type === 'tool_use' && block.name) {
            rec.toolUse[block.name] = (rec.toolUse[block.name] ?? 0) + 1;
          }
        }
      }
    } else if (line.includes('"type":"system"') && line.includes('"hookCount"')) {
      try {
        const obj = JSON.parse(line);
        if (typeof obj.hookCount === 'number') rec.hookCountSum += obj.hookCount;
      } catch {
        /* skip broken line */
      }
    }
  }

  return {
    days: [...rec.days].sort(),
    sidechainLines: rec.sidechainLines,
    hookCountSum: rec.hookCountSum,
    attributionSkills: rec.attributionSkills,
    toolUse: rec.toolUse,
    outputTokens: rec.outputTokens,
    inputTokens: rec.inputTokens,
    cacheReadTokens: rec.cacheReadTokens,
    models: rec.models,
  };
}

/**
 * Session transcripts live at several depths under projects/<proj>/:
 *   <session>.jsonl                                   → kind "session"
 *   <session>/subagents/agent-*.jsonl                 → kind "subagent"
 *   <session>/subagents/workflows/wf_<id>/agent-<id>.jsonl → kind "workflow"
 * sessionKey ties subagent transcripts back to their parent session.
 */
async function walkProject(projectDir, out) {
  let entries;
  try {
    entries = await fs.readdir(projectDir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    if (e.isFile() && e.name.endsWith('.jsonl')) {
      out.push({
        path: join(projectDir, e.name),
        kind: 'session',
        sessionKey: e.name.slice(0, -6),
      });
    } else if (e.isDirectory()) {
      await walkNested(join(projectDir, e.name), e.name, out, 0);
    }
  }
}

async function walkNested(dir, sessionKey, out, depth) {
  if (depth > 4) return;
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    if (e.isFile() && e.name.endsWith('.jsonl')) {
      out.push({
        path: join(dir, e.name),
        kind: dir.includes(`${sep}workflows${sep}`) || basename(dir).startsWith('wf_')
          ? 'workflow'
          : 'subagent',
        sessionKey,
      });
    } else if (e.isDirectory()) {
      await walkNested(join(dir, e.name), sessionKey, out, depth + 1);
    }
  }
}

async function listSessionFiles(claudeDir, projectFilter) {
  const projectsDir = join(claudeDir, 'projects');
  let dirs;
  try {
    dirs = (await fs.readdir(projectsDir, { withFileTypes: true })).filter((e) =>
      e.isDirectory()
    );
  } catch {
    return [];
  }
  if (projectFilter) {
    const needle = projectFilter.replaceAll('/', '-').toLowerCase();
    dirs = dirs.filter((e) => e.name.toLowerCase().includes(needle));
  }
  const files = [];
  await Promise.all(
    dirs.map(async (d) => {
      const perDir = [];
      await walkProject(join(projectsDir, d.name), perDir);
      for (const f of perDir) f.project = d.name;
      files.push(...perDir);
    })
  );
  return files;
}

/** Run tasks over items with bounded concurrency. */
async function pool(items, limit, worker) {
  let next = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      await worker(items[i], i);
    }
  });
  await Promise.all(runners);
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Aggregate all session JSONL files under <claudeDir>/projects/.
 *
 * options: { cacheDir, noCache, projectFilter, onProgress(done, total, cached) }
 * Returns merged metrics for the scorer plus per-file cache stats.
 */
export async function scanSessions(claudeDir, options = {}) {
  const { cacheDir, noCache = false, projectFilter, onProgress } = options;
  const files = await listSessionFiles(claudeDir, projectFilter);
  const cache = cacheDir && !noCache ? await loadCache(cacheDir) : {};

  const records = [];
  let done = 0;
  let cachedCount = 0;

  await pool(files, CONCURRENCY, async (file) => {
    let st;
    try {
      st = await fs.stat(file.path);
    } catch {
      done += 1;
      return;
    }
    const entry = cache[file.path];
    let record;
    if (!noCache && cacheHit(entry, st.size, st.mtimeMs)) {
      record = entry.record;
      cachedCount += 1;
    } else {
      record = await scanFile(file.path);
      cache[file.path] = { sizeBytes: st.size, mtimeMs: st.mtimeMs, record };
    }
    records.push({ file, record });
    done += 1;
    onProgress?.(done, files.length, cachedCount);
  });

  // Drop cache entries for deleted files so the cache doesn't grow forever.
  if (cacheDir) {
    const live = new Set(files.map((f) => f.path));
    for (const key of Object.keys(cache)) {
      if (!live.has(key)) delete cache[key];
    }
    await saveCache(cacheDir, cache);
  }

  // ---- merge ----
  const sessionRecords = records.filter((r) => r.file.kind === 'session');
  const spawnedIn = new Set(); // sessions that spawned subagents/workflows
  for (const r of records) {
    if (r.file.kind !== 'session') spawnedIn.add(`${r.file.project}/${r.file.sessionKey}`);
  }
  for (const r of sessionRecords) {
    if (r.record.sidechainLines > 0) spawnedIn.add(`${r.file.project}/${r.file.sessionKey}`);
  }

  const merged = {
    sessionCount: sessionRecords.length,
    subagentTranscripts: records.filter((r) => r.file.kind !== 'session').length,
    workflowAgents: records.filter((r) => r.file.kind === 'workflow').length,
    sessionProjects: new Set(sessionRecords.map((r) => r.file.project)).size,
    dayCounts: {},
    sidechainSessions: 0,
    hookCountSum: 0,
    attributionSkillLines: 0,
    attributionSkills: {},
    toolUse: {},
    agentToolUses: 0,
    outputTokens: 0,
    inputTokens: 0,
    cacheReadTokens: 0,
    models: {},
    activeDays: 0,
    activeDaysLast30: 0,
  };

  merged.sidechainSessions = spawnedIn.size;

  for (const { record: r } of records) {
    for (const d of r.days) merged.dayCounts[d] = (merged.dayCounts[d] ?? 0) + 1;
    merged.hookCountSum += r.hookCountSum;
    for (const [k, v] of Object.entries(r.attributionSkills ?? {})) {
      merged.attributionSkills[k] = (merged.attributionSkills[k] ?? 0) + v;
      merged.attributionSkillLines += v;
    }
    for (const [k, v] of Object.entries(r.toolUse)) {
      merged.toolUse[k] = (merged.toolUse[k] ?? 0) + v;
    }
    merged.outputTokens += r.outputTokens;
    merged.inputTokens += r.inputTokens;
    merged.cacheReadTokens += r.cacheReadTokens;
    for (const [k, v] of Object.entries(r.models)) {
      merged.models[k] = (merged.models[k] ?? 0) + v;
    }
  }

  merged.agentToolUses = (merged.toolUse.Agent ?? 0) + (merged.toolUse.Task ?? 0);
  merged.days = Object.keys(merged.dayCounts).sort();
  merged.activeDays = merged.days.length;
  const cutoff = Date.now() - 30 * DAY_MS;
  merged.activeDaysLast30 = merged.days.filter(
    (d) => Date.parse(`${d}T00:00:00Z`) >= cutoff
  ).length;

  return { metrics: merged, fileCount: files.length, cachedCount };
}
