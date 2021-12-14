describe('Onboarding Flow', () => {
  it('can scaffold a project in e2e mode', () => {
    cy.scaffoldProject('unify-onboarding')
    cy.openProject('unify-onboarding')
    cy.loginUser()

    cy.visitLaunchpad()
    cy.get('[data-cy-testingType=component]').click()
    cy.get('[data-testid=select-framework]').click()
    cy.findByText('Vue.js').click()
    cy.get('[data-testid=select-framework]').should('contain', 'Vue.js')
    cy.get('[data-testid=select-bundler]').findByText(cy.i18n.setupPage.projectSetup.bundlerPlaceholder).click()
    cy.findByText('Webpack').click()
    cy.get('[data-testid=select-bundler]').should('contain', 'Webpack')
    cy.reload()
    cy.get('[data-testid=select-framework]').should('contain', 'Vue.js')
    cy.get('[data-testid=select-bundler]').should('contain', 'Webpack')
    cy.findByText('Next Step').click()
    cy.get('h1').should('contain', 'Dependencies')
  })

  it('redirects to initialize plugin if CT is configured', () => {
    cy.scaffoldProject('unify-onboarding-with-config')
    cy.openProject('unify-onboarding-with-config')

    cy.visitLaunchpad()
    cy.get('[data-cy-testingType=component]').click()
    cy.get('h1').should('contain', 'Initializing Config...')
  })
})
