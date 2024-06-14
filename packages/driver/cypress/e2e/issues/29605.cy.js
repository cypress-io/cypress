// https://github.com/cypress-io/cypress/issues/29093
describe('issue #29605', () => {
  before(() => {
    cy
    .viewport('macbook-16')
    .visit('/fixtures/issue-29605.html')
  })

  it('can click selection when display: contents width used', () => {
    // cy.
    cy.get('#child').should('be.visible')
  })
})
