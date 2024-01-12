describe('always passes', () => {
  it('always passes', function () {
    cy.visit('http://www.cypress.io')
    expect(true).to.be.true
  })
})
