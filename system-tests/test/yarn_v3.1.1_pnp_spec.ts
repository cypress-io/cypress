import path from 'path'
import systemTests from '../lib/system-tests'
import Fixtures from '../lib/fixtures'

const cypressCli = path.join(__dirname, '../../cli/bin/cypress')
const projectDir = Fixtures.projectPath('yarn-v3.1.1-pnp')

describe('e2e yarn v3.1.1', () => {
  systemTests.it('can compile plugin and test specs', {
    snapshot: false,
    command: 'yarn',
    browser: 'electron',
    project: 'yarn-v3.1.1-pnp',
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
