const e2e = require('../support/helpers/e2e').default

describe('e2e stdout', () => {
  e2e.setup()

  it('displays errors from failures', function () {
    return e2e.exec(this, {
      port: 2020,
      snapshot: true,
      spec: 'stdout_failing_spec.coffee',
      expectedExitCode: 3,
    })
  })

  it('displays errors from exiting early due to bundle errors', function () {
    return e2e.exec(this, {
      spec: 'stdout_exit_early_failing_spec.js',
      snapshot: true,
      expectedExitCode: 1,
      onStdout: e2e.normalizeWebpackErrors,
    })
  })

  it('does not duplicate suites or tests between visits', function () {
    return e2e.exec(this, {
      spec: 'stdout_passing_spec.coffee',
      timeout: 120000,
      snapshot: true,
    })
  })

  it('respects quiet mode', function () {
    return e2e.exec(this, {
      spec: 'stdout_passing_spec.coffee',
      timeout: 120000,
      snapshot: true,
      quiet: true,
    })
  })

  it('displays fullname of nested specfile', function () {
    return e2e.exec(this, {
      port: 2020,
      snapshot: true,
      spec: 'nested-1/nested-2/nested-3/*',
    })
  })

  e2e.it('displays assertion errors', {
    spec: 'stdout_assertion_errors_spec.js',
    snapshot: true,
    expectedExitCode: 4,
  })
})
