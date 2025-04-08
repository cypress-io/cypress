describe('Cypress In Cypress Origin Communicator', () => {
  describe('primary origin memory leak prevention', () => {
    let removeAllListenersSpy

    beforeEach(() => {
      removeAllListenersSpy = undefined
      cy.scaffoldProject('cypress-in-cypress')
      cy.findBrowsers()
      cy.openProject('cypress-in-cypress')
      cy.startAppServer()
    })

    /**
     * NOTE: This is more of a integration style test suite. We are not verifying that cy.origin works in these cases,
     * but that old event emitter references are cleaned up upon revisit to make sure memory is cleaned up appropriately
     * and does not leave dangling references on stale communicator instances
     */
    it('cleans up the primaryOriginCommunicator events when navigating away from the /specs to /runs', () => {
      cy.visitApp()
      cy.specsPageIsVisible()
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
      cy.specsPageIsVisible()
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
      cy.specsPageIsVisible()
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

  describe('cy.origin passivity with app interactions', () => {
    beforeEach(() => {
      cy.scaffoldProject('session-and-origin-e2e-specs')
      cy.findBrowsers()
      cy.openProject('session-and-origin-e2e-specs')
      cy.startAppServer()
    })

    /**
     * NOTE: This suite is more e2e in nature, verifying that log messages are NOT duplicated and the test actually passes without
     * remote state issues.
     */
    it('passes upon revisit from /specs ', () => {
      cy.on('uncaught:exception', () => {
        // since cy-in-cy also has a top window listener that receives messages, but doesn't reify them, sometimes errors are propagated
        // up from a log property with err: being undefined. ignore uncaught exceptions and use the assertions in the test as a means of success
        return false
      })

      cy.visitApp()
      cy.specsPageIsVisible()
      cy.contains('simple_origin.cy').click()
      cy.waitForSpecToFinish()

      cy.get('.passed > .num').should('contain', 1)
      // make sure duplicate logs are not present
      cy.get('.command-name-origin').find('.command-name-log').should('have.length', 2)

      cy.findByTestId('sidebar-link-specs-page').click()
      cy.location('hash').should('include', '/specs')

      cy.contains('simple_origin.cy').click()
      cy.waitForSpecToFinish()

      cy.get('.passed > .num').should('contain', 1)
      // make sure duplicate logs are not present
      cy.get('.command-name-origin').find('.command-name-log').should('have.length', 2)
    })

    it('passes upon test reload mid test execution', () => {
      cy.on('uncaught:exception', () => {
        // since cy-in-cy also has a top window listener that receives messages, but doesn't reify them, sometimes errors are propagated
        // up from a log property with err: being undefined. ignore uncaught exceptions and use the assertions in the test as a means of success
        return false
      })

      cy.visitApp()
      cy.specsPageIsVisible()
      cy.contains('simple_origin.cy').click()
      cy.waitForSpecToFinish()

      cy.get('.passed > .num').should('contain', 1)
      // make sure duplicate logs are not present
      cy.get('.command-name-origin').find('.command-name-log').should('have.length', 2)

      cy.withCtx(async (ctx) => {
        const indexPath = ctx.path.join('cypress', 'e2e', 'origin', 'simple_origin.cy.js')

        await ctx.actions.file.writeFileInProject(
          indexPath,
          (await ctx.file.readFileInProject(indexPath)).replace('REPLACE THIS COMMENT FOR HOT RELOAD', 'HOT RELOADED'),
        )
      })

      cy.waitForSpecToFinish()

      cy.get('.passed > .num').should('contain', 1)
      // make sure duplicate logs are not present
      cy.get('.command-name-origin').find('.command-name-log').should('have.length', 2)
    })
  })
})
