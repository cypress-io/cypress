import systemTests from '../lib/system-tests'

describe('e2e runnable execution', () => {
  systemTests.setup({
    servers: [{
      port: 3434,
      static: true,
    },
    {
      port: 4545,
      static: true,
    },
    {
      port: 5656,
      static: true,
    }],
  })

  // navigation in before and in test body doesn't cause infinite loop
  // but throws correct error
  // https://github.com/cypress-io/cypress/issues/1987
  systemTests.it('cannot navigate in before hook and test', {
    project: 'hooks-after-rerun',
    spec: 'beforehook-and-test-navigation.cy.js',
    snapshot: true,
    expectedExitCode: 2,
  })

  systemTests.it('runnables run correct number of times with navigation', {
    project: 'hooks-after-rerun',
    spec: 'runnable-run-count.cy.js',
    snapshot: true,
  })

  systemTests.it('runs correctly after top navigation with already ran suite', {
    spec: 'runnables_already_run_suite.cy.js',
    snapshot: true,
    expectedExitCode: 1,
    config: { video: false },
  })
})
