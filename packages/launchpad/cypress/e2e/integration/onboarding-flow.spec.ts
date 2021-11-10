describe('Onboarding Flow', () => {
  it('can scaffold a project in e2e mode', () => {
    cy.openE2E('unify-onboarding')
    cy.loginUser()

    cy.visitLaunchpad()
    cy.get('[data-cy-testingType=component]').click()
    cy.get('[data-cy=select-framework]').click()
    cy.get('[data-cy-framework=vue]').click()
    cy.get('[data-cy=select-framework]').should('contain', 'Vue')
    cy.get('[data-cy=select-bundler]').click()
    cy.get('[data-cy-bundler=webpack]').click()
    cy.get('[data-cy=select-bundler]').should('contain', 'Webpack')
    cy.reload()
    cy.get('[data-cy=select-framework]').should('contain', 'Vue')
    cy.get('[data-cy=select-bundler]').should('contain', 'Webpack')
    cy.findByText('Next Step').click()
    cy.get('h1').should('contain', 'Dependencies')
  })

  it('redirects to initialize plugin if CT is configured', () => {
    cy.openE2E('unify-onboarding-with-config')

    cy.visitLaunchpad()
    cy.get('[data-cy-testingType=component]').click()
    cy.get('h1').should('contain', 'Initializing Config...')
  })
})
