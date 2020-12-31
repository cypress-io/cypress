/* eslint-disable no-undef */
describe('cy.go', () => {
  it('can move between pages correctly', () => {
    cy.visit('http://localhost:1818/first')
    cy.get('h1').should('contain', 'first')
    cy.get('a').click()
    cy.url().should('match', /second/)
    cy.get('h1').should('contain', 'second')
    cy.go('back')
    cy.url().should('match', /first/)
    cy.get('h1').should('contain', 'first')
    cy.go('forward')
    cy.url().should('match', /second/)
    cy.get('h1').should('contain', 'second')
  })

  it('can visit two urls and go back and forward', () => {
    cy.visit('http://localhost:1818/first').contains('first')
    cy.visit('http://localhost:1818/second').contains('second')
    cy.go('back').contains('first')
    cy.go('forward').contains('second')
  })
})
