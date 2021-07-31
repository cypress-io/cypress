import InstallDependencies from './InstallDependencies.vue'

describe('<InstallDependencies />', () => {
  beforeEach(() => {
    cy.mount(() => <InstallDependencies />, {
      setupContext (ctx) {
        ctx.wizard.setBundler('webpack')
        ctx.wizard.setFramework('nextjs')
      },
    })
  })

  it('playground', () => {
    cy.contains('@cypress/react').should('exist')
    cy.contains('@cypress/webpack-dev-server').should('exist')
  })

  it('should infinitely toggle manual', () => {
    cy.contains('@cypress/react').should('exist')
    cy.contains('manually').click()
    cy.contains('yarn add').should('exist')
    cy.contains('Install manually').click()
    cy.contains('@cypress/react').should('exist')
    cy.contains('manually').click()
    cy.contains('yarn add').should('exist')
    cy.contains('Install manually').click()
    cy.contains('@cypress/react').should('exist')
  })

  it('should allow to toggle to manual', () => {
    cy.contains('manually').click()
  })
})
