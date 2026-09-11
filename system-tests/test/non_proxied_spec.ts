import systemTests from '../lib/system-tests'

describe('e2e non-proxied spec', () => {
  systemTests.setup()

  systemTests.it('passes', {
    spec: 'spec.cy.js',
    browser: 'chrome',
    project: 'non-proxied',
    snapshot: true,
    config: {
      // this spec screenshots what `Cypress.config('proxyUrl')` serves and asserts
      // WebSocket behavior through the proxy port — neither exists on the browser
      // (CDP) network path (#34563)
      forceHttp1: true,
    },
  })
})
