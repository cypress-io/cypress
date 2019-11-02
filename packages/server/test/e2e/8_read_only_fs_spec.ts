const e2e = require('../support/helpers/e2e')
const Fixtures = require('../support/helpers/fixtures')
const path = require('path')
import * as fs from 'fs'

describe('e2e project dir access', function () {
  e2e.setup()

  const projectPath = Fixtures.projectPath('e2e') // copied from `test/support/fixtures/projects/e2e`

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
    // Manually create these directories to prevent cypress crashing.
    fs.mkdirSync(path.join(projectPath, 'cypress', 'videos'))
    fs.mkdirSync(path.join(projectPath, 'cypress', 'screenshots'))

    chmodr(projectPath, 0o500)

    // test that we setup the folder structure correctly
    let err: any

    try {
      fs.accessSync(projectPath, fs.constants.W_OK)
    } catch (e) {
      err = e
    }
    expect(err).to.include({ code: 'EACCES' })

    return exec().finally(() => {
      chmodr(projectPath, 0o777)
    })
  }

  e2e.it('warns when unable to write to dir', {
    project: projectPath,
    browser: 'chrome',
    expectedExitCode: 0,
    spec: 'simple_spec.coffee',
    snapshot: true,
    onRun,
  })

  e2e.it('warns when unable to write a screenshot to disk', {
    project: projectPath,
    browser: 'chrome',
    expectedExitCode: 2,
    spec: 'simple_failing_spec.coffee',
    snapshot: true,
    onRun,
  })
})
