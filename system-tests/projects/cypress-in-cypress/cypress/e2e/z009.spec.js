describe('Blank Contents', () => {
  it('renders the blank page', () => {
    cy.get('svg')
  })

  it('renders the visit failure page', () => {
    cy.visit('http://localhost:999')
  })
})
