describe('Global Mode: Onboarding', () => {
  beforeEach(() => {
    cy.scaffoldProject('pristine')
    cy.openGlobalMode()
    cy.addProject('pristine')
    cy.visitLaunchpad()
  })

  it('scaffolds a project, go back to global screen, and state is cleared', () => {
    cy.get('[data-cy=project-card]').click()
    cy.get('[data-cy-testingtype="e2e"]').click()
    cy.get('h1').should('contain', 'Configuration Files')
    cy.get('[data-cy="global-mode-link"]').click()
    cy.get('[data-cy=project-card]').click()
    cy.get('h1').should('contain', 'Welcome to Cypress!')
    cy.get('[data-cy-testingtype="e2e"]').should('not.contain', 'Not Configured')
    cy.get('[data-cy-testingtype="e2e"]').click()
    cy.get('h1').should('contain', 'Choose a Browser')
  })

  it('does not show loading browsers interim before scaffolding screen', () => {
    const resolutionDelay = 1000

    cy.withCtx((ctx, o) => {
      const stub = o.sinon.stub(ctx.actions.wizard, 'scaffoldTestingType')

      // Force the resolution of the scaffolding testing types to simulate
      // the failing state in the assertion below
      stub.callsFake(async () => {
        await new Promise((resolve) => setTimeout(resolve, o.resolutionDelay))
        stub.restore()

        return ctx.actions.wizard.scaffoldTestingType()
      })
    }, { resolutionDelay })

    cy.get('[data-cy=project-card]').click()
    cy.get('[data-cy-testingtype="e2e"]').click()
    cy.get('[data-cy-testingtype="e2e"]').should('not.exist')
    cy.get('body', { timeout: resolutionDelay / 2 }).should('not.contain', 'Choose a Browser')
    cy.get('[data-e2e="spin"]')
    cy.get('h1').should('contain', 'Configuration Files')
  })
})
