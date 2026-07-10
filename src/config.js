import { homedir } from 'node:os';
import { join } from 'node:path';

/**
 * Resolve the Claude Code config directory to analyze.
 * Priority: --claude-dir flag > $CLAUDE_CONFIG_DIR > ~/.claude
 */
export function resolveClaudeDir(cliValue, env = process.env) {
  if (cliValue) return cliValue;
  if (env.CLAUDE_CONFIG_DIR) return env.CLAUDE_CONFIG_DIR;
  return join(homedir(), '.claude');
}

/**
 * Resolve the cache directory for scan results.
 * $XDG_CACHE_HOME > %LOCALAPPDATA% (win32) > ~/.cache
 */
export function resolveCacheDir(env = process.env, platform = process.platform) {
  if (env.XDG_CACHE_HOME) return join(env.XDG_CACHE_HOME, 'cc-mastery');
  if (platform === 'win32' && env.LOCALAPPDATA) return join(env.LOCALAPPDATA, 'cc-mastery');
  return join(homedir(), '.cache', 'cc-mastery');
}
