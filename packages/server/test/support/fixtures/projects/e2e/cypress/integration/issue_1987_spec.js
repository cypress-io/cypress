describe('suite', () => {
  before(() => {
    // will cause infinite top navigation
    cy.visit('http://localhost:3434')
  })

  it('test', () => {
  })

  it('causes domain navigation', () => {
    cy.visit('http://localhost:4545')
  })
})
