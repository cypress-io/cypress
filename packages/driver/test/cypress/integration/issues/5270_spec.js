describe('issue #5270', () => {
  it('with stripe asserting "not visible"', () => {
    cy.visit('fixtures/cross_origin.html')
    cy.get('.foo').should('not.be.visible')
  })
})
