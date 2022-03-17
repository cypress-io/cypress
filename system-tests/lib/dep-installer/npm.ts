import path from 'path'
import tempDir from 'temp-dir'

export function getNpmCommand (opts: {
  yarnV311: boolean
  updateLockFile: boolean
  isCI: boolean
  runScripts: boolean
}): string {
  let cmd = `npm ${opts.updateLockFile ? 'install' : 'ci'} --force `

  if (opts.yarnV311) throw new Error('_cyYarnV311 is not supported with NPM.')

  if (!opts.runScripts) cmd += ' --ignore-scripts'

  if (opts.isCI) cmd += ' --cache=~/.cy-npm-cache'
  else cmd += ` --cache=${path.join(tempDir, 'cy-system-tests-npm-cache', String(Date.now()))}`

  return cmd
}
