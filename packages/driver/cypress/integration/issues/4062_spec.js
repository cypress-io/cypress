describe('4062', () => {
  after(() => {
    cy.get('h2').first()
  })

  it('make a test fail', () => {
    const inputValue = 'fake'

    cy.on('fail', (err) => {
      expect(err.message).to.contain(inputValue)
      expect(err.name).to.eql('AssertionError')
    })

    cy.visit('https://example.cypress.io/commands/actions')
    cy.get('.action-email').should('have.value', inputValue)
  })
})
