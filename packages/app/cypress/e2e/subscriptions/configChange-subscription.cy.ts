function updateProjectIdInCypressConfig (value: string) {
  return cy.withCtx((ctx, o) => {
    let config = ctx.actions.file.readFileInProject('cypress.config.js')

    config = config.replace(`projectId: 'abc123'`, `projectId: '${o.value}'`)
    ctx.actions.file.writeFileInProject('cypress.config.js', config)
  }, { value })
}

function updateViewportHeightInCypressConfig (value: number) {
  return cy.withCtx((ctx, o) => {
    let config = ctx.actions.file.readFileInProject('cypress.config.js')

    config = config.replace(`e2e: {`, `e2e: {\n  viewportHeight: ${o.value},\n`)
    ctx.actions.file.writeFileInProject('cypress.config.js', config)
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
      cy.get('a').contains('Settings').click()
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

      // wait until it has passed
      cy.get('[data-model-state="passed"]').should('contain', 'renders the test content')
      cy.get('button').contains('1000x660')

      // update the config - the spec should re-execute with the new viewportHeight
      updateViewportHeightInCypressConfig(777)

      cy.get('[data-model-state="passed"]').should('contain', 'renders the test content')
      cy.get('button').contains('1000x777')
    })
  })
})
