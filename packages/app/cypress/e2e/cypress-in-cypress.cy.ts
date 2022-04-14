// For Cypress-in-Cypress tests that do not vary based on testing type
describe('Cypress in Cypress', { viewportWidth: 1500, defaultCommandTimeout: 10000 }, () => {
  const testingTypes = ['component', 'e2e'] as const

  testingTypes.forEach((testingType) => {
    it(`handles automation disconnects in ${testingType}`, () => {
      cy.scaffoldProject('cypress-in-cypress')
      cy.findBrowsers()
      cy.openProject('cypress-in-cypress')
      cy.startAppServer(testingType)
      cy.visitApp()

      cy.get('[data-cy="spec-item"]').first().click()
      // Let runner stabilize
      cy.get('#unified-reporter').should('be.visible')

      cy.withCtx((ctx) => {
        ctx.coreData.servers.appSocketServer?.emit('automation:disconnected')
      })

      cy.contains('h3', 'The Cypress extension has disconnected')

      cy.withCtx((ctx, { sinon }) => {
        sinon.stub(ctx.actions.project, 'launchProject').resolves()
      })

      cy.contains('button', 'Reload the browser').click()

      cy.withCtx((ctx) => {
        expect(ctx.actions.project.launchProject).to.have.been.called
      })

      cy.percySnapshot()
    })

    it(`handles automation missing in ${testingType}`, () => {
      let connectedCallback: any

      cy.scaffoldProject('cypress-in-cypress')
      cy.findBrowsers()
      cy.openProject('cypress-in-cypress')
      cy.startAppServer(testingType)
      cy.visitApp()

      cy.window().then((win) => {
        if (!win.ws) {
          throw new Error('"window.ws" is expected to be available')
        }

        const originalEmit: Function = win.ws.emit
        const stub = cy.stub(win.ws as any, 'emit')

        stub.callsFake((...args) => {
          if (args[0] === 'is:automation:client:connected') {
            connectedCallback = args[2]
          }

          originalEmit.call(win.ws, ...args)
        })
      })

      cy.get('[data-cy="spec-item"]').first().click()
      // Let runner stabilize
      cy.get('#unified-reporter').should('be.visible').then(() => {
        connectedCallback(false)
      })

      cy.contains('h3', 'The Cypress extension is missing')

      cy.percySnapshot()

      cy.get('[data-cy="select-browser"]').click()

      cy.percySnapshot()

      cy.withCtx((ctx, { sinon }) => {
        sinon.stub(ctx.actions.project, 'launchProject').resolves()
      })

      cy.contains('li', 'Electron').click()

      cy.withCtx((ctx) => {
        expect(ctx.coreData.activeBrowser?.displayName).eq('Electron')
        expect(ctx.actions.project.launchProject).to.have.been.called
      })
    })
  })
})
