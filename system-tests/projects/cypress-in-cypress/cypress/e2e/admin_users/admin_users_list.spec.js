describe('Blank Contents', () => {
  it('renders the blank page', () => {
    cy.contains('cy.visit()')
  })

  it('renders the visit failure page', () => {
    cy.visit('http://localhost:999')
  })
})
