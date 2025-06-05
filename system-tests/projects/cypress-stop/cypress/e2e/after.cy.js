describe('Cypress.stop() in after', () => {
  after(() => {
    console.log('after 1')
  })

  after(() => {
    Cypress.stop()
    console.log('after 2')
  })

  after(() => {
    console.log('after 3')
  })

  it('should run this test', () => {
    cy.url().should('equal', 'about:blank')
  })
})
