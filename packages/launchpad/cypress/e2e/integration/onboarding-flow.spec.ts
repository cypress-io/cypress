describe('Onboarding Flow', () => {
  it('can scaffold a project in e2e mode', () => {
    cy.scaffoldProject('unify-onboarding')
    cy.openProject('unify-onboarding')
    cy.loginUser()

    cy.visitLaunchpad()
    cy.get('[data-cy-testingType=component]').click()
    cy.findByTestId('select-framework').click()
    cy.findByText('Vue.js').click()
    cy.findByTestId('select-framework').should('contain', 'Vue.js')
    cy.findByTestId('select-bundler').findByText(cy.i18n.setupPage.projectSetup.bundlerPlaceholder).click()
    cy.findByText('Webpack').click()
    cy.findByTestId('select-bundler').should('contain', 'Webpack')
    cy.reload()
    cy.findByTestId('select-framework').should('contain', 'Vue.js')
    cy.findByTestId('select-bundler').should('contain', 'Webpack')
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
