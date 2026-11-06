import ExternalEditorSettings from './ExternalEditorSettings.vue'
// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these
import { defaultMessages } from '@cy/i18n'
import { ExternalEditorSettingsFragmentDoc } from '../../generated/graphql-test'

const editorText = defaultMessages.settingsPage.editor

describe('<ExternalEditorSettings />', () => {
  it('renders the placeholder by default', () => {
    cy.mountFragment(ExternalEditorSettingsFragmentDoc, {
      render: (gqlVal) => {
        return <ExternalEditorSettings gql={gqlVal} />
      },
    })

    cy.findByText(editorText.noEditorSelectedPlaceholder).should('be.visible')
  })

  it('renders the title and description', () => {
    cy.mountFragment(ExternalEditorSettingsFragmentDoc, {
      render: (gqlVal) => {
        return <ExternalEditorSettings gql={gqlVal} />
      },
    })

    cy.findByText(editorText.description).should('be.visible')
    cy.findByText(editorText.title).should('be.visible')
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
