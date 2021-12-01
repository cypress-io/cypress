describe('Index', () => {
  beforeEach(() => {
    cy.openModeSystemTest('component-tests')
    cy.visitApp()
  })

  context('with no specs', () => {
    beforeEach(() => {
      cy.visitApp()
      cy.withCtx((ctx, o) => {
        ctx.actions.file.removeFileInProject('cypress/integration/integration-spec.js')
      })
    })

    it('shows "Create your first spec"', () => {
      // after removing the default scaffolded spec, we should be prompted to create a first spec
      cy.visitApp()
      cy.contains('Create your first spec')
    })
  })
})
