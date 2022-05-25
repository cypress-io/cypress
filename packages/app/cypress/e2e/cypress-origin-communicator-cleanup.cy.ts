describe('Cypress In Cypress Origin Communicator Clean Up', () => {
  let removeAllListenersSpy

  beforeEach(() => {
    removeAllListenersSpy = undefined
    cy.scaffoldProject('cypress-in-cypress')
    cy.findBrowsers()
    cy.openProject('cypress-in-cypress')
    cy.startAppServer()
  })

  describe('primary origin memory leak prevention', () => {
    it('cleans up the primaryOriginCommunicator events when navigating away from the /specs to /runs', () => {
      cy.visitApp()
      cy.contains('dom-content.spec').click()
      cy.waitForSpecToFinish()

      cy.then(() => {
        // @ts-ignore
        removeAllListenersSpy = cy.spy(window.top[0].Cypress.primaryOriginCommunicator, 'removeAllListeners')
      })

      cy.get('a[href="#/runs"]').click()
      cy.location('hash').should('include', '/runs')

      cy.then(() => {
        expect(removeAllListenersSpy).to.be.calledOnce
      })
    })

    it('cleans up the primaryOriginCommunicator events when navigating away from the /specs to /settings', () => {
      cy.visitApp()
      cy.contains('dom-content.spec').click()
      cy.waitForSpecToFinish()

      cy.then(() => {
        // @ts-ignore
        removeAllListenersSpy = cy.spy(window.top[0].Cypress.primaryOriginCommunicator, 'removeAllListeners')
      })

      cy.get('a[href="#/settings"]').click()
      cy.location('hash').should('include', '/settings')

      cy.then(() => {
        expect(removeAllListenersSpy).to.be.calledOnce
      })
    })

    it('cleans up the primaryOriginCommunicator events when navigating to run a different spec', () => {
      cy.visitApp()
      cy.contains('dom-content.spec').click()
      cy.waitForSpecToFinish()

      cy.then(() => {
        // @ts-ignore
        removeAllListenersSpy = cy.spy(window.top[0].Cypress.primaryOriginCommunicator, 'removeAllListeners')
      })

      cy.get('[aria-controls="reporter-inline-specs-list"]').type('{enter}')
      cy.get('[data-cy="spec-row-item"]').contains('123').click()

      cy.then(() => {
        expect(removeAllListenersSpy).to.be.calledOnce
      })
    })
  })
})
