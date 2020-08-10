import e2e from '../support/helpers/e2e'
import Fixtures from '../support/helpers/fixtures'

describe('e2e runnable execution', () => {
  e2e.setup({
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
  e2e.it('cannot navigate in before hook and test', {
    project: Fixtures.projectPath('hooks-after-rerun'),
    spec: 'beforehook-and-test-navigation.js',
    snapshot: true,
    expectedExitCode: 2,
  })

  e2e.it('runnables run correct number of times with navigation', {
    project: Fixtures.projectPath('hooks-after-rerun'),
    spec: 'runnable-run-count.spec.js',
    snapshot: true,
  })
})
