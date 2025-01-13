import systemTests from '../lib/system-tests'

describe('invocation details', () => {
  systemTests.it('passes the test that asserts file locations for invocation details', {
    withBinary: true,
    browser: 'electron',
    dockerImage: 'cypress/base-internal:ubuntu22-node18',
    project: 'invocation-details',
    snapshot: false,
    expectedExitCode: 0,
  })
})
