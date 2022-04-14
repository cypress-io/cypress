describe('Cypress.Buffer', () => {
  it('matches the type returned from readFile', () => {
    cy.readFile('cypress/fixtures/app.js', null).then((buffer) => {
      expect(Cypress.Buffer.isBuffer(buffer)).to.be.true
    })
  })
})
