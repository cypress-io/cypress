const e2e = require('../support/helpers/e2e')

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
    spec: 'issue_1987_spec.js',
    snapshot: true,
  })
})
