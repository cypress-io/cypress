import { fs } from '@packages/server/lib/util/fs'
import systemTests from '../lib/system-tests'
import Fixtures from '../lib/fixtures'

// https://github.com/cypress-io/cypress/issues/20789
describe('e2e plugin config isInteractive', () => {
  systemTests.setup()

  systemTests.it('receives isInteractive=false and isTextTerminal=true in run mode', {
    browser: 'electron',
    project: 'plugin-config-is-interactive',
    snapshot: false,
    async onRun (execFn) {
      await execFn()

      const config = await fs.readJson(
        Fixtures.projectPath('plugin-config-is-interactive/setupNodeEvents.config.json'),
      )

      expect(config.isTextTerminal).to.equal(true)
      expect(config.isInteractive).to.equal(false)
    },
  })
})
