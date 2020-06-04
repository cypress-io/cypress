const e2e = require('../support/helpers/e2e').default

describe('e2e caught and uncaught hooks errors', () => {
  e2e.setup({
    servers: {
      port: 7878,
      static: true,
    },
  })

  it('failing1', function () {
    return e2e.exec(this, {
      spec: 'hook_caught_error_failing_spec.coffee',
      snapshot: true,
      expectedExitCode: 3,
    })
  })

  it('failing2', function () {
    return e2e.exec(this, {
      spec: 'hook_uncaught_error_failing_spec.coffee',
      snapshot: true,
      expectedExitCode: 1,
    })
  })

  it('failing3', function () {
    return e2e.exec(this, {
      spec: 'hook_uncaught_root_error_failing_spec.coffee',
      snapshot: true,
      expectedExitCode: 1,
    })
  })

  it('failing4', function () {
    return e2e.exec(this, {
      spec: 'hook_uncaught_error_events_failing_spec.coffee',
      snapshot: true,
      expectedExitCode: 1,
    })
  })
})
