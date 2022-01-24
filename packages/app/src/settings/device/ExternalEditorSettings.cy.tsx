import ExternalEditorSettings from './ExternalEditorSettings.vue'
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

    cy.percySnapshot()
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

    const optionsSelector = '[role=option]'
    const inputSelector = '[aria-haspopup=true]'

    cy.get(inputSelector).click()
    .get(optionsSelector).should('be.visible')
    .get(optionsSelector).then(($options) => {
      cy.wrap($options.first()).click()

      cy.percySnapshot()
    })
  })

  it('can input a custom binary', () => {
    cy.mountFragment(ExternalEditorSettingsFragmentDoc, {
      render: (gqlVal) => {
        return <ExternalEditorSettings gql={gqlVal} />
      },
    })

    cy.findByPlaceholderText('Custom path...').type('/usr/bin')
    cy.get('[data-cy="use-custom-editor"]').as('custom')
    cy.get('@custom').click()

    cy.get('@custom').should('be.focused')
    cy.get('[data-cy="use-well-known-editor"]').should('not.be.focused')

    cy.percySnapshot()
  })
})
