// A global style update would come from actionability, which runs before every click,
// so the repeated clicks are what make a flood stand out from the single font request
// a healthy page load makes.
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
