describe('src/cy/commands/navigation', () => {
  context('resets state', () => {
    it('resets the server state', () => {
      cy.stub(Cypress, 'backend').log(false).callThrough()

      Cypress.emitThen('test:before:run:async', {
        id: 'r1',
        currentRetry: 1,
      })
      .then(() => {
        expect(Cypress.backend).to.be.calledWith('reset:server:state')
      })
    })
  })
})
