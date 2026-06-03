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

// passing `hosts` via `config` (a `--config` CLI flag) rather than `settings`
// is important: `settings` rewrites the project's cypress.config.js and would
// drop its setupNodeEvents (and the registered tasks), whereas `config` merges
const commonConfig = {
  hosts: {
    '*.foobar.com': '127.0.0.1',
  },
}

// https://github.com/cypress-io/cypress/issues/27784
describe('e2e cy.origin privileged commands', () => {
  systemTests.setup({
    servers: [{
      port: 4466,
      onServer,
    }],
  })

  systemTests.it('allows a deeply nested privileged command inside a cy.origin() callback', {
    browser: '!webkit', // TODO(webkit): webkit does not support cy.origin()
    // keep the port the same as the cy.origin callback target
    port: PORT,
    spec: 'cy_origin_privileged_deeply_nested.cy.ts',
    config: commonConfig,
    expectedExitCode: 0,
    async onRun (exec) {
      const { stdout } = await exec()

      // the command should run, not be rejected as non-spec
      expect(stdout).not.to.contain('must only be invoked from the spec file or support file')
    },
  })
})
