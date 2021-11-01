import { SettingsPageFragmentDoc } from '../generated/graphql-test'
import SettingsPage from './SettingsPage.vue'

describe('<SettingsPage />', () => {
  it('renders', () => {
    cy.viewport(900, 800)
    cy.mountFragment(SettingsPageFragmentDoc, { render: (gql) => <SettingsPage gql={gql} /> })

    cy.contains('Project Settings').click()
  })
})
