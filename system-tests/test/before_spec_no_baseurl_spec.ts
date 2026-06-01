import { expect } from '../lib/spec_helper'
import systemTests from '../lib/system-tests'

// Regression test for https://github.com/cypress-io/cypress/issues/26300
// When no baseUrl is set and cy.visit() navigates to a different origin than
// the Cypress runner, the runner reloads its top window. The before:spec plugin
// event must fire exactly once per spec despite that mid-spec reload.
describe('e2e before:spec fires once per spec without baseUrl', () => {
  systemTests.setup({
    servers: {
      port: 3502,
      onServer (app) {
        app.get('/', (_req, res) => res.send('<html><body>app</body></html>'))
      },
    },
  })

  systemTests.it('before:spec fires exactly once when cy.visit() changes origin', {
    browser: 'electron',
    project: 'before-spec-no-baseurl',
    async onRun (execFn) {
      const { stdout } = await execFn()
      const count = (stdout.match(/before:spec:/g) || []).length

      expect(count).to.eq(1, `Expected before:spec to fire once per spec but it fired ${count} times.\nStdout:\n${stdout}`)
    },
  })
})
