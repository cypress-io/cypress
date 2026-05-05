describe('Cypress In Cypress Origin Communicator', () => {
  describe('primary origin memory leak prevention', () => {
    let spies: Array<ReturnType<typeof cy.spy>>
    let removeAllListenersSpy: ReturnType<typeof cy.spy>

    beforeEach(() => {
      spies = []
      cy.scaffoldProject('cypress-in-cypress')
      cy.findBrowsers()
      cy.openProject('cypress-in-cypress')
      cy.startAppServer()
    })

    // Spy on `removeAllListeners` for the current Cypress instance and every
    // future one the event-manager creates. Each inner Cypress owns its own
    // PrimaryOriginCommunicator, so when the "different spec" test triggers a
    // teardown-then-create sequence, we need to catch the cleanup on the OLD
    // instance and also spy the NEW one. Must be invoked after a spec has
    // loaded — before that, getEventManager() throws.
    const trackRemoveAllListenersOnAllCypressInstances = () => {
      cy.window().then((win) => {
        const em = win.getEventManager()
        const trackSpy = (cypress) => {
          spies.push(cy.spy(cypress.primaryOriginCommunicator, 'removeAllListeners'))
        }

        const current = em.getCypress()

        if (current) trackSpy(current)

        em.on('cypress:created', trackSpy)
      })
    }

    const assertZeroArgCleanupFired = () => {
      cy.wrap(null).should(() => {
        const noArgCalls = spies.flatMap((spy) => spy.getCalls()).filter((c) => c.args.length === 0)

        expect(noArgCalls.length).to.be.at.least(1)
      })
    }

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
      trackRemoveAllListenersOnAllCypressInstances()

      cy.get('a[href="#/runs"]').click()
      cy.location('hash').should('include', '/runs')

      assertZeroArgCleanupFired()
    })

    it('clears cached spec bridge window targets when primaryOriginCommunicator.removeAllListeners() runs without an event', () => {
      cy.visitApp()
      cy.specsPageIsVisible()
      cy.contains('dom-content.spec').click()
      cy.waitForSpecToFinish()

      cy.then(() => {
        // @ts-ignore
        const comm = window.top[0].Cypress.primaryOriginCommunicator

        // @ts-ignore — hold stub across navigation for the assertion below
        window.__cyCommunicatorMapTest = { postMessage: cy.stub() }

        comm.onMessage({
          data: { event: 'cross:origin:bridge:ready', origin: 'https://cypress-map-teardown-test.invalid' },
          // @ts-ignore
          source: window.__cyCommunicatorMapTest,
        })

        // @ts-ignore
        removeAllListenersSpy = cy.spy(comm, 'removeAllListeners')
      })

      cy.get('a[href="#/runs"]').click()
      cy.location('hash').should('include', '/runs')

      cy.wrap(null).should(() => {
        const noArgCalls = removeAllListenersSpy.getCalls().filter((c) => c.args.length === 0)

        expect(noArgCalls.length).to.be.at.least(1)

        // @ts-ignore
        const comm = window.top[0].Cypress.primaryOriginCommunicator
        // @ts-ignore
        const stub = window.__cyCommunicatorMapTest

        stub.postMessage.resetHistory()
        comm.toAllSpecBridges('test:map:should:not:reach:stub', {})
        expect(stub.postMessage).not.to.have.been.called
        // @ts-ignore
        delete window.__cyCommunicatorMapTest
      })
    })

    it('cleans up the primaryOriginCommunicator events when navigating away from the /specs to /settings', () => {
      cy.visitApp()
      cy.specsPageIsVisible()
      cy.contains('dom-content.spec').click()
      cy.waitForSpecToFinish()
      trackRemoveAllListenersOnAllCypressInstances()

      cy.get('a[href="#/settings"]').click()
      cy.location('hash').should('include', '/settings')

      assertZeroArgCleanupFired()
    })

    it('cleans up the primaryOriginCommunicator events when navigating to run a different spec', () => {
      cy.visitApp()
      cy.specsPageIsVisible()
      cy.contains('dom-content.spec').click()
      cy.waitForSpecToFinish()
      trackRemoveAllListenersOnAllCypressInstances()

      cy.get('[aria-controls="reporter-inline-specs-list"]').type('{enter}')
      cy.get('[data-cy="spec-row-item"]').contains('123').click()
      cy.waitForSpecToFinish()

      assertZeroArgCleanupFired()
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
