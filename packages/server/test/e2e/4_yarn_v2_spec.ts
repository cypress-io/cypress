import fs from 'fs-extra'
import os from 'os'
import path from 'path'
import cp from 'child_process'
import util from 'util'
import e2e from '../support/helpers/e2e'
import Fixtures from '../support/helpers/fixtures'

const exec = async (cmd, ...args) => {
  console.log(`Running "${cmd}"...`)
  const ret = await util.promisify(cp.exec)(cmd, ...args)
  .catch((err) => {
    console.error('Error:', err)

    return err
  })

  console.log('stdout:', ret.stdout)
  ret.stderr && console.log('stderr:', ret.stderr)

  return ret
}

const fixtureDir = Fixtures.path('projects/yarn-v2')
const cypressCli = path.join(__dirname, '../../../../cli/bin/cypress')

describe('e2e yarn v2', () => {
  let projectDir

  beforeEach(async function () {
    this.timeout(240000)

    // copy yarn-v2 to tmpdir so node_modules resolution won't fall back to project root
    projectDir = path.join(os.tmpdir(), `cy-yarn-v2-${Date.now()}`)

    await fs.mkdir(projectDir)
    await fs.copy(fixtureDir, projectDir)

    const projectExec = (cmd) => exec(cmd, { cwd: projectDir })

    // set up and verify the yarn v2 project
    // https://yarnpkg.com/getting-started/migration#step-by-step
    await projectExec('yarn set version berry')
    expect((await projectExec('yarn --version')).stdout).to.match(/^2\./)
    await projectExec('yarn')
  })

  // @see https://github.com/cypress-io/cypress/pull/15623
  e2e.it('can load typescript plugins files', {
    snapshot: false,
    command: 'yarn',
    browser: 'electron',
    onRun: async (run) => {
      await run({
        args: `node ${cypressCli} run --dev --spec=* --project=${projectDir}`.split(' '),
        spawnOpts: {
          cwd: projectDir,
          shell: true,
        },
      })
    },
  })
})
