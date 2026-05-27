import { fs } from '@packages/server/lib/util/fs'
import systemTests from '../lib/system-tests'
import Fixtures from '../lib/fixtures'

describe('e2e plugin run events', () => {
  systemTests.setup()

  systemTests.it('sends events', {
    browser: 'electron',
    project: 'plugin-run-events',
    snapshot: true,
  })

  systemTests.it('handles async before:spec', {
    browser: 'electron',
    project: 'plugin-run-events',
    snapshot: true,
    configFile: 'cypress.config.beforeSpec.async.js',
  })

  systemTests.it('handles video being deleted in after:spec', {
    browser: 'electron',
    project: 'plugin-run-events',
    spec: '*1.cy.js',
    configFile: 'cypress.config.afterSpec.deleteVideo.js',
    snapshot: true,
  })

  systemTests.it('should not leave reserved compressed videos when deleting the video in after:spec', {
    browser: 'electron',
    project: 'plugin-run-events',
    spec: '*1.cy.js',
    configFile: 'cypress.config.afterSpec.deleteVideo.js',
    snapshot: false,
    async onRun (execFn) {
      await execFn()

      const videos = await fs.readdir(Fixtures.projectPath('plugin-run-events/cypress/videos'))

      expect(videos).to.deep.equal([])
    },
  })

  systemTests.it('fails run if event handler throws', {
    browser: 'electron',
    project: 'plugin-run-events',
    snapshot: true,
    expectedExitCode: 1,
    configFile: 'cypress.config.runEvent.throws.js',
    onStdout: (stdout) => {
      // TODO: Figure out how to fix the race condition on thrown exceptions in before:spec that causes additional electron exceptions to fire: https://github.com/cypress-io/cypress/issues/24102
      return stdout.trimRight()
    },
  })
})
