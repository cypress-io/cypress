// Actionability runs before every click, so repeating it is what would surface a flood.
const CLICKS_PER_TEST = 10

describe('font flooding', () => {
  it('will not occur', () => {
    cy.visit('cypress/fixtures/font-flooding.html')

    Cypress._.times(CLICKS_PER_TEST, () => {
      cy.get('#btn').click()
    })

    cy.get('#btn').should('have.text', 'Clicked')
  })

  it('will not occur', () => {
    cy.visit('cypress/fixtures/font-flooding.html')

    Cypress._.times(CLICKS_PER_TEST, () => {
      cy.get('#btn').click()
    })

    cy.get('#btn').should('have.text', 'Clicked')
  })
})
