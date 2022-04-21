function updateViewportInCypressConfig (value: number) {
  return cy.withCtx((ctx, o) => {
    let config = ctx.actions.file.readFileInProject('cypress.config.js')

    config = config.replace('viewportHeight: 660', `viewportHeight: ${o.value}`)
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
      cy.contains('viewportHeight: 660')
      updateViewportInCypressConfig(42)
      cy.contains('viewportHeight: 42')
    })
  })
})
