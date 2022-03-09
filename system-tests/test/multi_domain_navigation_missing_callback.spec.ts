import path from 'path'
import systemTests, { expect } from '../lib/system-tests'
import Fixtures from '../lib/fixtures'

const e2ePath = Fixtures.projectPath('e2e')

const PORT = 3500
const onServer = function (app) {
  app.get('/multi_domain_secondary.html', (_, res) => {
    res.sendFile(path.join(e2ePath, `multi_domain_secondary.html`))
  })
}

describe('e2e multi domain errors', () => {
  systemTests.setup({
    servers: [{
      port: 4466,
      onServer,
    }],
    settings: {
      hosts: {
        '*.foobar.com': '127.0.0.1',
      },
    },
  })

  systemTests.it('captures the stack trace correctly for multi-domain errors to point users to their "switchToDomain" callback', {
    // keep the port the same to prevent issues with the snapshot
    port: PORT,
    spec: 'multi_domain_navigation_missing_callback_spec.ts',
    snapshot: true,
    expectedExitCode: 1,
    config: {
      experimentalMultiDomain: true,
      experimentalSessionSupport: true,
    },
    async onRun (exec) {
      const res = await exec()

      expect(res.stdout).to.contain('If cross origin navigation was intentional, `cy.switchToDomain()` needs to immediately follow a cross origin navigation event.')
      expect(res.stdout).to.contain('Otherwise, Cypress does not allow you to navigate to a different origin URL within a single test.')
      expect(res.stdout).to.contain('https://on.cypress.io/switch-to-domain')
    },
  })
})
