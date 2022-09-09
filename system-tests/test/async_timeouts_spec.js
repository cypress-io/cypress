const systemTests = require('../lib/system-tests').default

describe('e2e async timeouts', () => {
  systemTests.setup()

  systemTests.it('failing1', {
    /* browser: '!webkit', */ // TODO(webkit): fix+unskip (failing due to broken stack trace)
    spec: 'async_timeouts.cy.js',
    snapshot: true,
    expectedExitCode: 2,
  })
})
