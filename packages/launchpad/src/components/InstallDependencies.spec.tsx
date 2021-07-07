import { SupportedBundlerWebpack } from '../utils/bundler'
import { SupportedFrameworkNext } from '../utils/frameworks'
import InstallDependencies from './InstallDependencies.vue'

describe('<InstallDependencies />', () => {
  beforeEach(() => {
    cy.mount(() => <InstallDependencies />).then(() => {
      Cypress.storeConfig.setComponentSetup({
        bundler: SupportedBundlerWebpack,
        framework: SupportedFrameworkNext,
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
