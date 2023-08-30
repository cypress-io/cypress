import * as fs from 'fs'
import * as path from 'path'
import systemTests from '../lib/system-tests'
import Fixtures from '../lib/fixtures'
import { scaffoldCommonNodeModules } from '@tooling/system-tests/lib/dep-installer'

describe('e2e readonly fs', function () {
  systemTests.setup()

  const projectPath = Fixtures.projectPath('read-only-project-root')

  /**
   * Change permissions recursively
   */
  const chmodr = (p: string, mode: number) => {
    const stats = fs.statSync(p)

    fs.chmodSync(p, mode)
    if (stats.isDirectory()) {
      fs.readdirSync(p).forEach((child) => {
        chmodr(path.join(p, child), mode)
      })
    }
  }

  const onRun = async (exec) => {
    try {
      await Fixtures.scaffoldProject('read-only-project-root')
      await scaffoldCommonNodeModules()
      chmodr(projectPath, 0o500)

      await exec()
    } finally {
      chmodr(projectPath, 0o777)
    }
  }

  systemTests.it('warns when unable to write to disk', {
    project: 'read-only-project-root',
    expectedExitCode: 1,
    spec: 'spec.cy.js',
    snapshot: true,
    skipScaffold: true,
    onRun,
  })
})
