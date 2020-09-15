const e2e = require('../support/helpers/e2e').default

describe('e2e caught and uncaught hooks errors', () => {
  e2e.setup({
    servers: {
      port: 7878,
      static: true,
    },
  })

  e2e.it('failing1', {
    spec: 'hook_caught_error_failing_spec.coffee',
    snapshot: true,
    expectedExitCode: 3,
  })

  e2e.it('failing2', {
    spec: 'hook_uncaught_error_failing_spec.coffee',
    snapshot: true,
    expectedExitCode: 1,
  })

  e2e.it('failing3', {
    spec: 'hook_uncaught_root_error_failing_spec.coffee',
    snapshot: true,
    expectedExitCode: 1,
  })

  e2e.it('failing4', {
    spec: 'hook_uncaught_error_events_failing_spec.coffee',
    snapshot: true,
    expectedExitCode: 1,
  })
})
