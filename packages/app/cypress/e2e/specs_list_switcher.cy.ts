describe('App: Spec List Testing Type Switcher', () => {
  context('ct unconfigured', () => {
    beforeEach(() => {
      cy.scaffoldProject('cypress-in-cypress')
      cy.openProject('cypress-in-cypress')

      cy.withCtx(async (ctx, o) => {
        const config = await ctx.file.readFileInProject('cypress.config.js')
        const newCypressConfig = config.replace(`component:`, `_component:`)

        await ctx.actions.file.writeFileInProject('cypress.config.js', newCypressConfig)
      })

      cy.startAppServer('e2e')

      cy.visitApp()
      cy.contains('E2E specs')
    })

    it('switches testing types', () => {
      cy.findByTestId('testing-type-switch').within(() => {
        cy.findByText('Component specs').click()
      })

      cy.contains('Component testing is not set up for this project')

      cy.findByTestId('testing-type-setup-button').should('be.visible')
    })
  })

  context('e2e unconfigured', () => {
    beforeEach(() => {
      cy.scaffoldProject('cypress-in-cypress')
      cy.openProject('cypress-in-cypress')

      cy.withCtx(async (ctx, o) => {
        const config = await ctx.file.readFileInProject('cypress.config.js')
        const newCypressConfig = config.replace(`e2e:`, `_e2e:`)

        await ctx.actions.file.writeFileInProject('cypress.config.js', newCypressConfig)
      })

      cy.startAppServer('component')

      cy.visitApp()
      cy.contains('Component specs')
    })

    it('switches testing types', () => {
      cy.findByTestId('testing-type-switch').within(() => {
        cy.findByText('E2E specs').click()
      })

      cy.contains('End-to-end testing is not set up for this project')

      cy.findByTestId('testing-type-setup-button').should('be.visible')
    })
  })
})
