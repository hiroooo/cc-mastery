import { promises as fs } from 'node:fs';
import { join, dirname } from 'node:path';

const CACHE_FILE = 'scan-cache-v1.json';

/** Load the per-file scan cache. Missing/corrupt cache → empty. */
export async function loadCache(cacheDir) {
  try {
    const raw = await fs.readFile(join(cacheDir, CACHE_FILE), 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/** Persist the cache atomically (tmp + rename). Failures are non-fatal. */
export async function saveCache(cacheDir, cache) {
  const target = join(cacheDir, CACHE_FILE);
  const tmp = `${target}.tmp-${process.pid}`;
  try {
    await fs.mkdir(dirname(target), { recursive: true });
    await fs.writeFile(tmp, JSON.stringify(cache));
    await fs.rename(tmp, target);
  } catch {
    try {
      await fs.unlink(tmp);
    } catch {
      /* ignore */
    }
  }
}

/** A cache entry is valid when the file has the same size and mtime. */
export function cacheHit(entry, sizeBytes, mtimeMs) {
  return Boolean(entry && entry.sizeBytes === sizeBytes && entry.mtimeMs === mtimeMs);
}
