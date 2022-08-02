const systemTests = require('../lib/system-tests').default

describe('e2e issue 6407', () => {
  systemTests.setup()

  // https://github.com/cypress-io/cypress/issues/6407
  it('throws if mutating read-only config with test configuration', function () {
    return systemTests.exec(this, {
      spec: 'issue_6407_spec.js',
      snapshot: true,
      expectedExitCode: 1,
    })
  })
})
