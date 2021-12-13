const systemTests = require('../lib/system-tests').default

describe('e2e caught and uncaught hooks errors', () => {
  systemTests.setup({
    servers: {
      port: 7878,
      static: true,
    },
  })

  systemTests.it('failing1', {
    spec: 'hook_caught_error_failing.cy.js',
    snapshot: true,
    expectedExitCode: 3,
  })

  systemTests.it('failing2', {
    spec: 'hook_uncaught_error_failing.cy.js',
    snapshot: true,
    expectedExitCode: 1,
  })

  systemTests.it('failing3', {
    spec: 'hook_uncaught_root_error_failing.cy.js',
    snapshot: true,
    expectedExitCode: 1,
  })

  systemTests.it('failing4', {
    spec: 'hook_uncaught_error_events_failing.cy.js',
    snapshot: true,
    expectedExitCode: 1,
  })
})
