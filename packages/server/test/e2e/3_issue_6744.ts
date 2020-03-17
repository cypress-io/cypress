const e2e = require('../support/helpers/e2e')

// https://github.com/cypress-io/cypress/issues/6744
describe('e2e issue 6744', () => {
  e2e.setup()

  // this tests that the error is logged when user
  // clicks on the 'print error' button in open mode
  e2e.it('can print error from .only test', {
    spec: 'only-error.spec.js',
    expectedExitCode: 1,
  })
})
