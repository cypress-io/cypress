const e2e = require('../support/helpers/e2e').default

describe('e2e uncaught errors', () => {
  e2e.setup()

  e2e.it('failing1', {
    spec: 'uncaught_synchronous_before_tests_parsed.coffee',
    snapshot: true,
    expectedExitCode: 1,
  })

  e2e.it('failing2', {
    spec: 'uncaught_synchronous_during_hook_spec.coffee',
    snapshot: true,
    expectedExitCode: 1,
  })

  e2e.it('failing3', {
    spec: 'uncaught_during_test_spec.coffee',
    snapshot: true,
    expectedExitCode: 3,
  })

  e2e.it('failing4', {
    spec: 'uncaught_during_hook_spec.coffee',
    snapshot: true,
    expectedExitCode: 1,
  })

  e2e.it('failing5', {
    spec: 'caught_async_sync_test_spec.coffee',
    snapshot: true,
    expectedExitCode: 4,
  })
})
