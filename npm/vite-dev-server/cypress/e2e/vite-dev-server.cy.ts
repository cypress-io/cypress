/// <reference types="Cypress" />
/// <reference path="../support/e2e.ts" />

describe('Config options', () => {
  it('supports supportFile = false', () => {
    cy.scaffoldProject('vite2.9.1-react')
    cy.openProject('vite2.9.1-react', ['--config-file', 'cypress-vite-no-support.config.ts'])
    cy.startAppServer('component')

    cy.withCtx(async (ctx) => {
      await ctx.actions.file.removeFileInProject(`src/AppCompilationError.cy.jsx`)
    })

    cy.visitApp()
    cy.contains('App.cy.jsx').click()
    cy.waitForSpecToFinish()
    cy.get('.passed > .num').should('contain', 1)
  })

  it('chooses new port when specified port is in use', () => {
    cy.scaffoldProject('vite2.9.1-react')
    cy.openProject('vite2.9.1-react', ['--config-file', 'cypress-vite-port-in-use.config.ts'])
    cy.startAppServer('component')

    cy.visitApp()

    cy.contains('App.cy.jsx').click()
    cy.get('.passed > .num').should('contain', 1)

    cy.withCtx(async (ctx) => {
      const config = ctx.lifecycleManager.loadedFullConfig

      expect(config.baseUrl).to.equal('http://localhost:3001')
    })
  })
})
