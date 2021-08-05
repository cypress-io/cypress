import ExternalEditorSettings from './ExternalEditorSettings.vue'

describe('<ExternalEditorSettings />', () => {
  it('renders', () => {
    cy.mount(() => <ExternalEditorSettings class="p-12" />)
  })
})
