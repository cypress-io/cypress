import fs from 'fs-extra'
import os from 'os'
import path from 'path'
import cp from 'child_process'
import util from 'util'
import e2e from '../support/helpers/e2e'
import Fixtures from '../support/helpers/fixtures'

const fixtureDir = Fixtures.path('projects/yarn-v2')

describe('e2e yarn v2', () => {
  let projectDir

  beforeEach(async function () {
    this.timeout(240000)

    // copy yarn-v2 to tmpdir so node_modules resolution won't fall back to project root
    projectDir = path.join(os.tmpdir(), `cy-yarn-v2-${Date.now()}`)

    await fs.mkdir(projectDir)
    await fs.copy(fixtureDir, projectDir)

    const exec = (cmd) => util.promisify(cp.exec)(cmd, { cwd: projectDir })

    // set up and verify the yarn v2 project
    // https://yarnpkg.com/getting-started/migration#step-by-step
    await exec('yarn set version berry')
    expect((await exec('yarn --version')).stdout).to.match(/^2\./)
    await exec('yarn')
  })

  // @see https://github.com/cypress-io/cypress/pull/15623
  e2e.it('can load typescript plugins files', {
    browser: 'electron',
    spec: '*',
    snapshot: false,
    onRun: async (exec) => {
      await exec({ project: projectDir })
    },
  })
})
