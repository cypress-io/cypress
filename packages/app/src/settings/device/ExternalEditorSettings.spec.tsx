import ExternalEditorSettings from './ExternalEditorSettings.vue'
import { defaultMessages } from '../../locales/i18n'

const editorText = defaultMessages.settingsPage.editor

describe('<ExternalEditorSettings />', () => {
  beforeEach(() => {
    cy.mount(() => <ExternalEditorSettings class="p-12" />)
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
      const text = $options.first().text()

      cy.wrap($options.first()).click()
      .get(optionsSelector).should('not.exist')
      .get(inputSelector).should('have.text', text)
    })
  })
})
