import systemTests, { expect } from '../lib/system-tests'

const onServer = function (app) {
  // serve a trivial page for any host so every unique subdomain resolves
  app.get('*', (req, res) => {
    res.set('Content-Type', 'text/html')

    return res.send('<!DOCTYPE html><html><head></head><body><h1>tenant</h1></body></html>')
  })
}

// https://github.com/cypress-io/cypress/issues/33233
describe('e2e dynamic baseUrl reload loop', () => {
  systemTests.setup({
    servers: {
      port: 4567,
      onServer,
    },
  })

  systemTests.it('fails with a clear error instead of hanging when a dynamic baseUrl keeps changing origin', {
    browser: '!webkit', // TODO(webkit): fix+unskip (needs multidomain support)
    spec: 'dynamic_baseurl_reload_loop.cy.js',
    expectedExitCode: 1,
    config: {
      hosts: {
        '*.foobar.com': '127.0.0.1',
      },
    },
    async onRun (exec) {
      const { stdout } = await exec()

      expect(stdout).to.contain('entered an infinite reload loop')
      expect(stdout).to.contain('injectDocumentDomain')
    },
  })
})
