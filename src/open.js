import { spawn } from 'node:child_process';

/** Open a file in the default browser, best-effort (never throws). */
export function openInBrowser(path, platform = process.platform) {
  const [cmd, args] =
    platform === 'darwin'
      ? ['open', [path]]
      : platform === 'win32'
        ? ['cmd', ['/c', 'start', '', path]]
        : ['xdg-open', [path]];
  try {
    spawn(cmd, args, { detached: true, stdio: 'ignore' }).unref();
  } catch {
    /* non-fatal */
  }
}
