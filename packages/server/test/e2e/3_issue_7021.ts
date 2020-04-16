const e2e = require('../support/helpers/e2e')

describe('e2e issue 6619', () => {
  e2e.setup({
    servers: [{
      port: 3434,
      static: true,
    },
    {
      port: 3535,
      static: true,
    }],
  })

  // https://github.com/cypress-io/cypress/issues/7021
  // before/after hooks should not be rerun on top navigation
  e2e.it('can reload during spec run', {
    spec: 'issue_7021_spec.js',
    snapshot: true,
    timeout: 30000,
  })
})
