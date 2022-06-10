import path from 'path'
import systemTests, { expect } from '../lib/system-tests'
import Fixtures from '../lib/fixtures'

const e2ePath = Fixtures.projectPath('e2e')

const PORT = 3500
const onServer = function (app) {
  app.get('/secondary_origin.html', (_, res) => {
    res.sendFile(path.join(e2ePath, `secondary_origin.html`))
  })
}

// TODO: This is probably more appropriate for a cy-in-cy test
// https://github.com/cypress-io/cypress/issues/20973
describe('e2e cy.origin errors', () => {
  systemTests.setup({
    servers: [{
      port: 4466,
      onServer,
    }],
    settings: {
      e2e: {},
      hosts: {
        '*.foobar.com': '127.0.0.1',
      },
    },
  })

  systemTests.it('captures the stack trace correctly for errors in cross origins to point users to their "cy.origin" callback', {
    // keep the port the same to prevent issues with the snapshot
    port: PORT,
    spec: 'cy_origin_error.cy.ts',
    snapshot: true,
    expectedExitCode: 1,
    config: {
      experimentalSessionAndOrigin: true,
    },
    async onRun (exec) {
      const res = await exec()

      expect(res.stdout).to.contain('AssertionError')
      expect(res.stdout).to.contain('Timed out retrying after 1000ms: Expected to find element: `#doesnotexist`, but never found it.')

      // check to make sure the snapshot contains the 'cy.origin' sourcemap
      expect(res.stdout).to.contain('http://localhost:3500/__cypress/tests?p=cypress/e2e/cy_origin_error.cy.ts:102:12')
    },
  })
})
