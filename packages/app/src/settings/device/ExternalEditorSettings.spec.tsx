import ExternalEditorSettings from './ExternalEditorSettings.vue'
import { defaultMessages } from '@cy/i18n'
import { ExternalEditorSettingsFragmentDoc } from '../../generated/graphql-test'

const editorText = defaultMessages.settingsPage.editor

describe('<ExternalEditorSettings />', () => {
  beforeEach(() => {
    cy.mountFragment(ExternalEditorSettingsFragmentDoc, {
      render: (gqlVal) => {
        return <ExternalEditorSettings gql={gqlVal} />
      },
    })
  })

  it('renders the placeholder by default', () => {
    cy.findByText(editorText.noEditorSelectedPlaceholder).should('be.visible')
  })

  it('renders the title and description', () => {
    cy.findByText(editorText.description).should('be.visible')
    cy.findByText(editorText.title).should('be.visible')
  })

  it('can select an editor', () => {
    const optionsSelector = '[role=option]'
    const inputSelector = '[aria-haspopup=true]'

    cy.get(inputSelector).click()
    .get(optionsSelector).should('be.visible')
    .get(optionsSelector).then(($options) => {
      cy.wrap($options.first()).click()
    })
  })
})
