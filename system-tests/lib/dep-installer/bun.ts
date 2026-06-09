import path from 'path'
import tempDir from 'temp-dir'
import { homedir } from 'os'
import type { InstallCommand, InstallCommandOpts } from './types'

export function getBunCommand (opts: InstallCommandOpts): InstallCommand {
  let cmd = 'bun install'

  if (opts.yarnV311) throw new Error('_cyYarnV311 is not supported with BUN.')

  if (!opts.runScripts) cmd += ' --ignore-scripts'

  if (!opts.updateLockFile) cmd += ' --frozen-lockfile'

  // Bun configures cache directory via BUN_INSTALL_CACHE_DIR environment variable, not a flag
  const cacheDir = opts.isCI
    ? path.join(homedir(), '.bun', 'install', 'cache')
    : path.join(tempDir, 'cy-system-tests-bun-cache', String(Date.now()))

  return {
    cmd,
    env: {
      BUN_INSTALL_CACHE_DIR: cacheDir,
    },
  }
}
