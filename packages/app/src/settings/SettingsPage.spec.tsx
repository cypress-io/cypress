import SettingsPage from './SettingsPage.vue'

describe('<SettingsPage />', () => {
  it('renders', () => {
    cy.viewport(900, 800)
    cy.mount(() => <SettingsPage />)

    cy.contains('Project Settings').click()
  })
})
