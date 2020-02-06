describe('issue #5270', () => {
  it('with stripe asserting "not visible"', () => {
    cy.visit('fixtures/with_stripe.html')
    cy.get('.foo').should('not.be.visible')
  })
})
