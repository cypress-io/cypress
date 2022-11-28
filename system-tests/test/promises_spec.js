const systemTests = require('../lib/system-tests').default

describe('e2e promises', () => {
  systemTests.setup()

  systemTests.it('failing1', {
    spec: 'promises.cy.js',
    snapshot: true,
    expectedExitCode: 2,
  })
})
