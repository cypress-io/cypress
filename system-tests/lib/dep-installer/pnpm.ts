import path from 'path'
import tempDir from 'temp-dir'
import { homedir } from 'os'
import type { InstallCommand, InstallCommandOpts } from './types'

export function getPnpmCommand (opts: InstallCommandOpts): InstallCommand {
  let cmd = 'pnpm install'

  if (opts.yarnV311) throw new Error('_cyYarnV311 is not supported with PNPM.')

  if (!opts.runScripts) cmd += ' --ignore-scripts'

  if (!opts.updateLockFile) cmd += ' --frozen-lockfile'

  if (opts.isCI) cmd += ` --store-dir=${homedir()}/.pnpm-store`
  else cmd += ` --store-dir=${path.join(tempDir, 'cy-system-tests-pnpm-store', String(Date.now()))}`

  return { cmd }
}
