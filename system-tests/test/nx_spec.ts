import systemTests from '../lib/system-tests'
import Fixtures from '../lib/fixtures'

const projectDir = Fixtures.projectPath('nx-workspace')

describe('nx', () => {
  systemTests.it('can run nx', {
    snapshot: false,
    browser: 'electron',
    command: 'yarn',
    project: 'nx-workspace',
    onRun: async (run) => {
      await run({
        args: `nx e2e react-app-e2e`.split(' '),
        spawnOpts: {
          cwd: projectDir,
        },
      })
    },
  })
})
