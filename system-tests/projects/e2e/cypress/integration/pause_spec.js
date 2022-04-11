describe('cy.pause()', () => {
  it('pauses', () => {
    let didPause = false

    cy.visit('https://example.cypress.io')

    cy.once('paused', (name) => {
      cy.once('paused', (name) => {
        didPause = true

        // resume the rest of the commands so this
        // test ends
        Cypress.emit('resume:all')
      })

      Cypress.emit('resume:next')
    })

    cy.pause().wrap({}).should('deep.eq', {}).then(function () {
      expect(didPause).to.be.true

      // should no longer have onPaused
      expect(cy.state('onPaused')).to.be.null
    })
  })
})
