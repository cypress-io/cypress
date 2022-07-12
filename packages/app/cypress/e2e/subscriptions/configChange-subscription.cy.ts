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

describe('specChange subscription', () => {
  beforeEach(() => {
    cy.scaffoldProject('cypress-in-cypress')
    cy.openProject('cypress-in-cypress')
    cy.startAppServer()
    cy.visitApp()
  })

  describe('on config page', () => {
    it('responds to configChange event when viewport is changed', () => {
      cy.contains('a', 'Settings').click()
      cy.get('[data-cy="collapsible-header"]').contains('Project Settings').click()
      cy.contains(`projectId: 'abc123'`)
      updateProjectIdInCypressConfig('foo456')
      cy.contains(`projectId: 'foo456'`)
    })
  })

  describe('on runner page', () => {
    it('responds to configChange event and re-runs spec', () => {
      // run spec
      cy.contains('dom-content.spec').click()
      cy.waitForSpecToFinish()

      // wait until it has passed
      cy.get('[data-model-state="passed"]').should('contain', 'renders the test content')
      cy.get('button').contains('1000x660')

      // update the config - the spec should re-execute with the new viewportHeight
      updateViewportHeightInCypressConfig(777)

      cy.waitForSpecToFinish()
      cy.get('[data-model-state="passed"]').should('contain', 'renders the test content')
      cy.get('button').contains('1000x777')
    })
  })
})
