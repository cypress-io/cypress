const systemTests = require('../lib/system-tests').default

describe('e2e async timeouts', () => {
  systemTests.setup()

  systemTests.it('failing1', {
    spec: 'async_timeouts.cy.js',
    snapshot: true,
    expectedExitCode: 2,
  })
})
