const helpers = require('../../support/helpers')

const { createCypress } = helpers
const { runIsolatedCypress } = createCypress()

// https://github.com/cypress-io/cypress/issues/18042
describe('issue 18042', () => {
  beforeEach(function () {
    return runIsolatedCypress(`cypress/fixtures/issues/issue-18042.js`)
  })

  it('Call count is shown even if cy.stub().log(false)', function () {
    cy.contains('Spies / Stubs (1)').click()
    cy.get('.call-count').eq(1).should('have.text', '1')
  })
})
