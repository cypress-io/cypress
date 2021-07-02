import { SupportedBundlerWebpack } from '../statics/bundler'
import { SupportedFrameworkNext } from '../statics/frameworks'
import InstallDependencies from './InstallDependencies.vue'

describe('<InstallDependencies />', () => {
  beforeEach(() => {
    cy.mount(() => (
      <InstallDependencies />
    )).then(() => {
      Cypress.store.setComponentSetup({
        bundler: SupportedBundlerWebpack,
        framework: SupportedFrameworkNext,
        complete: true,
      })
    })
  })

  it('playground', () => {
    cy.contains('@cypress/react').should('exist')
    cy.contains('@cypress/webpack-dev-server').should('exist')
  })

  it('should infinitely toggle manual', () => {
    cy.contains('@cypress/react').should('exist')
    cy.contains('manually').click()
    cy.contains('@cypress/react').should('not.exist')
    cy.contains('Install manually').click()
    cy.contains('@cypress/react').should('exist')
    cy.contains('manually').click()
    cy.contains('@cypress/react').should('not.exist')
    cy.contains('Install manually').click()
    cy.contains('@cypress/react').should('exist')
  })
})
