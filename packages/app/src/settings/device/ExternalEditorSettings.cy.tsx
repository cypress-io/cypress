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

  it('can input a custom binary', () => {
    cy.mountFragment(ExternalEditorSettingsFragmentDoc, {
      render: (gqlVal) => {
        return <ExternalEditorSettings gql={gqlVal} />
      },
    })

    const inputSelector = '[aria-haspopup=true]'

    cy.get(inputSelector).click()

    cy.contains('Custom').click()
    cy.get('[data-cy="custom-editor"]').should('exist')

    cy.findByPlaceholderText(editorText.customPathPlaceholder).type('/usr/bin').should('have.value', '/usr/bin')
  })
})
