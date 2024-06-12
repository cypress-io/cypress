describe('App: Spec List Testing Type Switcher', () => {
  context('e2e unconfigured', () => {
    beforeEach(() => {
      cy.scaffoldProject('cypress-in-cypress')
      cy.openProject('cypress-in-cypress', ['--component'])

      cy.startAppServer('component')

      cy.withCtx(async (ctx, o) => {
        const config = await ctx.file.readFileInProject('cypress.config.js')
        const newCypressConfig = config.replace(`e2e:`, `_e2e:`)

        await ctx.actions.file.writeFileInProject('cypress.config.js', newCypressConfig)
      })

      cy.visitApp()
      cy.specsPageIsVisible()
      cy.verifyCtSelected()
    })

    it('switches testing types', () => {
      cy.findByTestId('testing-type-switch').within(() => {
        cy.findByText('E2E').click()
      })

      cy.contains('End-to-end testing is not set up for this project')

      cy.findByTestId('testing-type-setup-button').should('be.visible')
    })
  })

  context('ct unconfigured', () => {
    beforeEach(() => {
      cy.scaffoldProject('cypress-in-cypress')
      cy.openProject('cypress-in-cypress')

      cy.startAppServer('e2e')

      cy.withCtx(async (ctx, o) => {
        const config = await ctx.file.readFileInProject('cypress.config.js')
        const newCypressConfig = config.replace(`component:`, `_component:`)

        await ctx.actions.file.writeFileInProject('cypress.config.js', newCypressConfig)
      })

      cy.visitApp()
      cy.specsPageIsVisible()
      cy.verifyE2ESelected()
    })

    it('switches testing types', () => {
      cy.findByTestId('testing-type-switch').within(() => {
        cy.findByText('Component').click()
      })

      cy.verifyCtSelected()

      cy.contains('Component testing is not set up for this project')

      cy.findByTestId('testing-type-setup-button').should('be.visible')
    })
  })

  context('both testing types configured', () => {
    beforeEach(() => {
      cy.scaffoldProject('cypress-in-cypress')
      cy.findBrowsers()
      cy.openProject('cypress-in-cypress', ['--component'])

      cy.startAppServer('component')

      cy.visitApp()
      cy.specsPageIsVisible()
      cy.verifyCtSelected()
    })

    it('displays expected switch content', () => {
      cy.findByTestId('unconfigured-icon').should('not.exist')

      cy.withCtx((ctx, o) => {
        o.sinon.stub(ctx.actions.project, 'setAndLoadCurrentTestingType')
        o.sinon.stub(ctx.actions.project, 'reconfigureProject').resolves()
      })

      cy.findByTestId('testing-type-switch').within(() => {
        cy.findByText('E2E').click()
      })

      cy.verifyE2ESelected()

      cy.withCtx((ctx) => {
        expect(ctx.coreData.app.relaunchBrowser).eq(true)
        expect(ctx.actions.project.setAndLoadCurrentTestingType).to.have.been.calledWith('e2e')
        expect(ctx.actions.project.reconfigureProject).to.have.been.called
      })
    })
  })
})
