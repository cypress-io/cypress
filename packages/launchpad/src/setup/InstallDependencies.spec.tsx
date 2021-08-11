import InstallDependencies from './InstallDependencies.vue'
import { InstallDependenciesFragmentDoc } from '../generated/graphql'

describe('<InstallDependencies />', () => {
  beforeEach(() => {
    cy.mountFragment(InstallDependenciesFragmentDoc, {
      type: (ctx) => {
        ctx.wizard.setBundler('webpack')
        ctx.wizard.setFramework('react')

        return ctx.wizard
      },
      render: (gqlVal) => {
        return <InstallDependencies gql={gqlVal} />
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
