import path from 'path'
import tempDir from 'temp-dir'
import { homedir } from 'os'

export function getNpmCommand (opts: {
  yarnV311: boolean
  updateLockFile: boolean
  isCI: boolean
  runScripts: boolean
}): string {
  // `npm ci` is undesirable here since it won't use our `node_modules` cache
  // https://github.com/npm/cli/issues/564
  let cmd = 'npm install --force'

  if (opts.yarnV311) throw new Error('_cyYarnV311 is not supported with NPM.')

  if (!opts.runScripts) cmd += ' --ignore-scripts'

  if (opts.isCI) cmd += ` --cache=${homedir()}/.cy-npm-cache`
  else cmd += ` --cache=${path.join(tempDir, 'cy-system-tests-npm-cache', String(Date.now()))}`

  return cmd
}
