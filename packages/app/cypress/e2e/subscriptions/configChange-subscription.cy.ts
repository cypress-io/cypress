function updateProjectIdInCypressConfig (value: string) {
  return cy.withCtx(async (ctx, o) => {
    let config = await ctx.actions.file.readFileInProject('cypress.config.js')

    config = config.replace(`projectId: 'abc123'`, `projectId: '${o.value}'`)
    await ctx.actions.file.writeFileInProject('cypress.config.js', config)
  }, { value })
}

function updateViewportHeightInCypressConfig (value: number) {
  return cy.withCtx(async (ctx, o) => {
    let config = await ctx.actions.file.readFileInProject('cypress.config.js')

    config = config.replace(`e2e: {`, `e2e: {\n  viewportHeight: ${o.value},\n`)
    await ctx.actions.file.writeFileInProject('cypress.config.js', config)
  }, { value })
}

describe('configChange subscription', () => {
  beforeEach(() => {
    cy.scaffoldProject('cypress-in-cypress')
    cy.openProject('cypress-in-cypress')
    cy.startAppServer()
    cy.visitApp()
    cy.specsPageIsVisible()
  })

  describe('on config page', () => {
    it('responds to configChange event when viewport is changed', () => {
      cy.contains('a', 'Settings').click()
      cy.get('[data-cy="collapsible-header"]').contains('Project settings').click()
      cy.contains(`projectId: 'abc123'`)
      updateProjectIdInCypressConfig('foo456')
      cy.contains(`projectId: 'foo456'`)
    })
  })

  describe('on specs list page', () => {
    it('responds to configChange event when viewport is changed', () => {
      cy.contains('a', 'Specs').click()
      updateViewportHeightInCypressConfig(888)

      // validate the spinner appears and then goes away
      cy.contains('[role="alert"]', 'Loading')
      cy.get('[data-cy="loading-spinner"]').should('be.visible')
      cy.get('[data-cy="loading-spinner"]').should('not.be.exist')
    })
  })

  describe('on runner page', () => {
    it('responds to configChange event and re-runs spec', () => {
      // run spec
      cy.contains('dom-content.spec').click()
      cy.waitForSpecToFinish()

      // wait until it has passed
      cy.get('[data-model-state="passed"]').should('contain', 'renders the test content')
      cy.get('[data-cy="viewport-size"]').contains('1000x660')

      // update the config - the spec should re-execute with the new viewportHeight
      updateViewportHeightInCypressConfig(777)

      // validate the spinner appears and then goes away
      cy.contains('[role="alert"]', 'Loading')
      cy.get('[data-cy="loading-spinner"]').should('be.visible')
      cy.get('[data-cy="loading-spinner"]').should('not.be.exist')

      cy.waitForSpecToFinish()
      cy.get('[data-model-state="passed"]').should('contain', 'renders the test content')
      cy.get('[data-cy="viewport-size"]').contains('1000x777')
    })
  })
})
