const systemTests = require('../lib/system-tests').default

describe('e2e uncaught errors', () => {
  systemTests.setup()

  systemTests.it('failing1', {
    spec: 'uncaught_synchronous_before_tests_parsed.js',
    snapshot: true,
    expectedExitCode: 1,
  })

  systemTests.it('failing2', {
    spec: 'uncaught_synchronous_during_hook.cy.js',
    snapshot: true,
    expectedExitCode: 1,
  })

  systemTests.it('failing3', {
    spec: 'uncaught_during_test.cy.js',
    snapshot: true,
    expectedExitCode: 3,
  })

  systemTests.it('failing4', {
    spec: 'uncaught_during_hook.cy.js',
    snapshot: true,
    expectedExitCode: 1,
  })

  systemTests.it('failing5', {
    spec: 'caught_async_sync_test.cy.js',
    snapshot: true,
    expectedExitCode: 4,
  })
})
