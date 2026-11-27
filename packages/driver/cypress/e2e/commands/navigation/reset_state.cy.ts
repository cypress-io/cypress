describe('src/cy/commands/navigation', () => {
  context('resets state', () => {
    it('resets the server state', () => {
      cy.stub(Cypress, 'backend').log(false).callThrough()

      Cypress.emitThen('test:before:run:async', {
        id: 'r1',
        currentRetry: 1,
      })
      // @ts-expect-error - cli/types declares emitThen as returning BluebirdStatic rather than a Bluebird promise
      .then(() => {
        expect(Cypress.backend).to.be.calledWith('reset:server:state')
      })
    })
  })
})
