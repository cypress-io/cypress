import path from 'path'
import tempDir from 'temp-dir'
import { homedir } from 'os'

export function getYarnCommand (opts: {
  yarnV311: boolean
  updateLockFile: boolean
  isCI: boolean
  runScripts: boolean
}): string {
  let cmd = `yarn install`

  if (opts.yarnV311) {
    // @see https://yarnpkg.com/cli/install
    if (!opts.runScripts) cmd += ' --mode=skip-build'

    if (!opts.updateLockFile) cmd += ' --immutable'

    return cmd
  }

  cmd += ' --prefer-offline'

  if (!opts.runScripts) cmd += ' --ignore-scripts'

  if (!opts.updateLockFile) cmd += ' --frozen-lockfile'

  // yarn v1 has a bug with integrity checking and local cache/dependencies
  // @see https://github.com/yarnpkg/yarn/issues/6407
  cmd += ' --update-checksums'

  // in CircleCI, this offline cache can be used
  if (opts.isCI) cmd += ` --cache-folder=${homedir()}/.yarn`
  else cmd += ` --cache-folder=${path.join(tempDir, 'cy-system-tests-yarn-cache', String(Date.now()))}`

  return cmd
}
