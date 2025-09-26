import path from 'path'
import tempDir from 'temp-dir'
import { homedir } from 'os'

export function getBunCommand (opts: {
  updateLockFile: boolean
  isCI: boolean
  runScripts: boolean
}): string {
  let cmd = 'bun install'

  if (!opts.runScripts) cmd += ' --ignore-scripts'

  if (!opts.updateLockFile) cmd += ' --frozen-lockfile'

  // Bun uses different cache structure than npm/yarn
  if (opts.isCI) cmd += ` --cache=${homedir()}/.bun/install/cache`
  else cmd += ` --cache=${path.join(tempDir, 'cy-system-tests-bun-cache', String(Date.now()))}`

  return cmd
}
