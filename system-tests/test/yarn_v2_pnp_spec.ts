import fs from 'fs-extra'
import os from 'os'
import path from 'path'
import cp from 'child_process'
import util from 'util'
import systemTests from '../lib/system-tests'
import Fixtures from '../lib/fixtures'

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

const fixtureDir = Fixtures.projectPath('yarn-v2-pnp')
const cypressCli = path.join(__dirname, '../../cli/bin/cypress')

describe('e2e yarn v2', () => {
  let projectDir

  beforeEach(async function () {
    Fixtures.scaffold()

    this.timeout(240000)

    // copy yarn-v2 to tmpdir so node_modules resolution won't fall back to project root
    projectDir = path.join(os.tmpdir(), `cy-yarn-v2-pnp-${Date.now()}`)
    console.log(`projectDir`, projectDir)

    await fs.mkdir(projectDir)
    await fs.copy(fixtureDir, projectDir)

    const projectExec = (cmd) => exec(cmd, { cwd: projectDir })

    await projectExec('yarn')
  })

  systemTests.it('can compile plugin and test specs', {
    snapshot: false,
    command: 'yarn',
    browser: 'electron',
    onRun: async (run) => {
      await run({
        args: `node ${cypressCli} run --dev --project=./`.split(' '),
        spawnOpts: {
          cwd: projectDir,
          shell: true,
        },
      })
    },
  })
})
