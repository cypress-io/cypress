import ExternalEditorSettings from './ExternalEditorSettings.vue'
import { ExternalEditorSettingsFragmentDoc } from '../../generated/graphql-test'

describe('<ExternalEditorSettings />', () => {
  it('renders the placeholder by default', () => {
    cy.mountFragment(ExternalEditorSettingsFragmentDoc, {
      render: (gqlVal) => {
        return <ExternalEditorSettings gql={gqlVal} />
      },
    })

    cy.findByText('Choose your editor...').should('be.visible')
  })

  it('renders the title and description', () => {
    cy.mountFragment(ExternalEditorSettingsFragmentDoc, {
      render: (gqlVal) => {
        return <ExternalEditorSettings gql={gqlVal} />
      },
    })

    cy.findByText('External editor to use for editing code opened when using Cypress.').should('be.visible')
    cy.findByText('External editor').should('be.visible')
  })

  it('can select an editor', () => {
    cy.mountFragment(ExternalEditorSettingsFragmentDoc, {
      render: (gqlVal) => {
        return <ExternalEditorSettings gql={gqlVal} />
      },
    })

    cy.get('[aria-haspopup=true]').click()
    .get('[role=option]').should('be.visible')
    .then(($options) => {
      cy.wrap($options.first()).click()
    })

    cy.get('[aria-expanded="false"]').contains('VS Code')
  })

  it('does not offer a custom editor', () => {
    cy.mountFragment(ExternalEditorSettingsFragmentDoc, {
      render: (gqlVal) => {
        return <ExternalEditorSettings gql={gqlVal} />
      },
    })

    cy.get('[aria-haspopup=true]').click()

    cy.get('[role=option]').should('have.length.greaterThan', 0)
    cy.contains('[role=option]', 'Custom').should('not.exist')
  })
})
