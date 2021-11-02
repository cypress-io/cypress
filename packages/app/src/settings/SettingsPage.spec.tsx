import { SettingsPageFragmentDoc } from '../generated/graphql-test'
import { defaultMessages } from '@cy/i18n'
import SettingsPage from './SettingsPage.vue'

describe('<SettingsPage />', () => {
  it('renders', () => {
    cy.viewport(900, 800)
    cy.mountFragment(SettingsPageFragmentDoc, { render: (gql) => <SettingsPage gql={gql} /> })

    cy.contains('Project Settings').click()

    cy.findByText(defaultMessages.settingsPage.projectId.title).should('be.visible')
    cy.findByText(defaultMessages.settingsPage.config.title).should('be.visible').click()
  })
})
