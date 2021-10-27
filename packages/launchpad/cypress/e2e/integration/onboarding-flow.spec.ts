describe('Onboarding Flow', () => {
  beforeEach(() => {
    cy.setupE2E('unify-onboarding')
    cy.loginUser()
  })

  it('can scaffold a project in e2e mode', () => {
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
})
