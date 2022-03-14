import systemTests, { expect } from '../lib/system-tests'

const PORT = 13370
const onServer = function (app) {
  app.get('/cross_origin.html', (req, res) => {
    res.send('<html><h1>cross origin</h1></html>')
  })
}

// FIXME: This partially solves https://github.com/cypress-io/cypress/issues/19632 but only when "experimentalMultiDomain" is false.
// TODO: This will be further solved by https://github.com/cypress-io/cypress/issues/20428
describe('e2e cross origin navigation', () => {
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

  // FIXME: add test that supports this for firefox
  systemTests.it('captures cross origin failures when "experimentalMultiDomain" config value is falsy', {
    // keep the port the same to prevent issues with the snapshot
    port: PORT,
    spec: 'navigation_cross_origin_errors.ts',
    browser: ['chrome', 'electron'],
    snapshot: true,
    expectedExitCode: 1,
    config: {
      experimentalMultiDomain: false,
    },
    async onRun (exec) {
      const res = await exec()

      expect(res.stdout).to.contain('Cypress detected a cross origin error happened on page load')
      expect(res.stdout).to.contain('Before the page load, you were bound to the origin policy:')
      expect(res.stdout).to.contain('A cross origin error happens when your application navigates to a new URL which does not match the origin policy above.')
      expect(res.stdout).to.contain('A new URL does not match the origin policy if the \'protocol\', \'port\' (if specified), and/or \'host\' (unless of the same superdomain) are different.')
      expect(res.stdout).to.contain('Cypress does not allow you to navigate to a different origin URL within a single test.')
      expect(res.stdout).to.contain('You may need to restructure some of your test code to avoid this problem.')
      expect(res.stdout).to.contain('Alternatively you can also disable Chrome Web Security in Chromium-based browsers which will turn off this restriction by setting { chromeWebSecurity: false } in `cypress.json`.')
      expect(res.stdout).to.contain('https://on.cypress.io/cross-origin-violation')
    },
  })
})
