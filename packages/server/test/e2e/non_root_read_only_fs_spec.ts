import * as fs from 'fs'
import * as path from 'path'
import e2e from '../support/helpers/e2e'
import Fixtures from '../support/helpers/fixtures'

describe('e2e readonly fs', function () {
  e2e.setup()

  const projectPath = Fixtures.projectPath('read-only-project-root')

  const chmodr = (p: string, mode: number) => {
    const stats = fs.statSync(p)

    fs.chmodSync(p, mode)
    if (stats.isDirectory()) {
      fs.readdirSync(p).forEach((child) => {
        chmodr(path.join(p, child), mode)
      })
    }
  }

  const onRun = (exec) => {
    chmodr(projectPath, 0o500)

    return exec().finally(() => {
      chmodr(projectPath, 0o777)
    })
  }

  e2e.it('warns when unable to write to disk', {
    project: projectPath,
    expectedExitCode: 1,
    spec: 'spec.js',
    snapshot: true,
    onRun,
  })
})
