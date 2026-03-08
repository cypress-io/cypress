describe('studio functionality', () => {
  beforeEach(() => {
    cy.visit('cypress/e2e/index.html')
  })

  it('visits a basic html page', () => {
    cy.get('h1').should('have.text', 'Hello, Studio!')
  })
})
