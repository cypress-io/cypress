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

describe('studio', () => {
  it('create new transaction', () => {
    /* ==== Generated with Cypress Studio ==== */
    cy.visit('https://google.com')
    cy.get('[href="https://about.google/?fg=1&utm_source=google-AU&utm_medium=referral&utm_campaign=hp-header"]').click()
    /* ==== End Cypress Studio ==== */
  })
})
