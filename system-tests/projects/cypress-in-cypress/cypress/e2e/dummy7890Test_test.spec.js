describe('Blank Contents', () => {
  it('renders the blank page', () => {
    cy.get('[data-cy="cypress-logo"]')
  })

  it('renders the visit failure page', () => {
    cy.visit('http://localhost:999')
  })
})
