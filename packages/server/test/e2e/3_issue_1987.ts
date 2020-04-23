const e2e = require('../support/helpers/e2e')
const Fixtures = require('../support/helpers/fixtures')

describe('e2e issue 1987', () => {
  e2e.setup({
    servers: [{
      port: 3434,
      static: true,
    },
    {
      port: 4545,
      static: true,
    }],
  })

  // https://github.com/cypress-io/cypress/issues/1987
  // before/after hooks should not be rerun on top navigation
  e2e.it('can reload during spec run', {
    project: Fixtures.projectPath('hooks-after-rerun'),
    spec: 'beforehook-and-test-navigation.js',
    snapshot: true,
  })

  e2e.it('can run proper amount of hooks', {
    project: Fixtures.projectPath('hooks-after-rerun'),
    spec: 'afterhooks.spec.js',
    snapshot: true,
  })
})
