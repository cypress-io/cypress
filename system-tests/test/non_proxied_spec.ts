import systemTests from '../lib/system-tests'

const describeNonProxied = process.env.CYPRESS_INTERNAL_DISABLE_PROXY === '1'
  ? describe.skip
  : describe

// NOTE: this spec screenshots what `Cypress.config('proxyUrl')` serves and asserts
// WebSocket behavior through the proxy port — neither exists when the proxy is
// disabled (#34563).
describeNonProxied('e2e non-proxied spec', () => {
  systemTests.setup()

  systemTests.it('passes', {
    spec: 'spec.cy.js',
    browser: 'chrome',
    project: 'non-proxied',
    snapshot: true,
  })
})
