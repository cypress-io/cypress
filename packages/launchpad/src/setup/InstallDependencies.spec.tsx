import InstallDependencies from './InstallDependencies.vue'
import { InstallDependenciesFragmentDoc } from '../generated/graphql-test'
import { defaultMessages } from '@cy/i18n'

describe('<InstallDependencies />', () => {
  beforeEach(() => {
    cy.mountFragment(InstallDependenciesFragmentDoc, {
      type: (ctx) => {
        return ctx.stubWizard
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

  it('shows expected actions', () => {
    cy.contains('button', defaultMessages.clipboard.copy).should('be.visible')
    cy.contains('button', defaultMessages.setupPage.install.confirmManualInstall).should('be.visible')
    cy.contains('button', defaultMessages.setupPage.step.back).should('be.visible')
  })
})
