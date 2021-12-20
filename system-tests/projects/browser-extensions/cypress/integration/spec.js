context('before:browser:launch extension e2e', () => {
  it('has the expected extension', () => {
    cy.visit('/index.html')
    .get('#extension')
    .should('contain', 'inserted from extension!')
  })
})
