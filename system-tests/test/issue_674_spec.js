const systemTests = require('../lib/system-tests').default

describe('e2e issue 674', () => {
  systemTests.setup()

  // https://github.com/cypress-io/cypress/issues/674
  systemTests.it('fails', {
    spec: 'issue_674_spec.js',
    snapshot: true,
    expectedExitCode: 1,
  })
})
