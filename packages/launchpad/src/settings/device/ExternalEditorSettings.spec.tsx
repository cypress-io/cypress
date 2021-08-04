import ExternalEditorSettings from './ExternalEditorSettings.vue'
import IconLaptop from 'virtual:vite-icons/mdi/laptop'

describe('<ExternalEditorSettings />', () => {
  it('renders', () => {
    cy.mount(() => <ExternalEditorSettings />)
  })
})
