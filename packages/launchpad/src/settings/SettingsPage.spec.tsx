import SettingsPage from './SettingsPage.vue'

describe('<SettingsPage />', () => {
  it('renders', () => {
    cy.mount(() => <SettingsPage/>)
  })
})
