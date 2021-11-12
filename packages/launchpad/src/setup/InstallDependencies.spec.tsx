import InstallDependencies from './InstallDependencies.vue'
import { defaultMessages } from '@cy/i18n'
import { InstallDependenciesFragmentDoc } from '../generated/graphql-test'

describe('<InstallDependencies />', () => {
  beforeEach(() => {
    cy.mountFragment(InstallDependenciesFragmentDoc, {
      render: (gqlVal) => <InstallDependencies gql={gqlVal} />,
    })
  })

  it('displays package information and links', () => {
    cy.contains('a', '@cypress/react')
    .should('be.visible')
    .and('have.attr', 'href', 'https://www.npmjs.com/package/@cypress/react')

    cy.contains('a', '@cypress/webpack-dev-server')
    .should('be.visible')
    .and('have.attr', 'href', 'https://www.npmjs.com/package/@cypress/webpack-dev-server')

    cy.contains('Used to interact with React components via Cypress').should('be.visible')
    cy.contains('Used to bundle code').should('be.visible')
  })

  it('shows expected actions', () => {
    cy.contains('button', defaultMessages.clipboard.copy).should('be.visible')
    cy.contains('button', defaultMessages.setupPage.install.confirmManualInstall).should('be.visible')
    cy.contains('button', defaultMessages.setupPage.step.back).should('be.visible')
  })
})
