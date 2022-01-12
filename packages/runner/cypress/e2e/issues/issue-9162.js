const helpers = require('../../support/helpers')

const { createCypress } = helpers
const { runIsolatedCypress } = createCypress()

// https://github.com/cypress-io/cypress/issues/9162
describe('issue 9162', () => {
  beforeEach(function () {
    return runIsolatedCypress(`cypress/fixtures/issues/issue-9162.js`)
  })

  it('tests does not hang even if there is a fail in before().', function () {
    cy.contains('expected true to be false')
  })
})
