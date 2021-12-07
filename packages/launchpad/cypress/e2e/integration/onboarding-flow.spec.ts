describe('Onboarding Flow', () => {
  it('can scaffold a project in e2e mode', () => {
    cy.setupE2E('unify-onboarding')
    cy.loginUser()

    cy.visitLaunchpad()
    cy.get('[data-cy-testingType=component]').click()
    cy.get('[data-testid=select-framework]').click()
    cy.findByText('Vue.js').click()
    cy.get('[data-testid=select-framework]').should('contain', 'Vue')
    cy.findByText('Pick a bundler').click()
    cy.findByText('Webpack').click()
    cy.get('[data-testid=select-bundler]').should('contain', 'Webpack')
    cy.reload()
    cy.get('[data-testid=select-framework]').should('contain', 'Vue')
    cy.get('[data-testid=select-bundler]').should('contain', 'Webpack')
    cy.findByText('Next Step').click()
    cy.get('h1').should('contain', 'Dependencies')
  })

  it('redirects to initialize plugin if CT is configured', () => {
    cy.setupE2E('unify-onboarding-with-config')

    cy.visitLaunchpad()
    cy.get('[data-cy-testingType=component]').click()
    cy.get('h1').should('contain', 'Initializing Config...')
  })
})
