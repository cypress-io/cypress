import { SettingsContainerFragmentDoc } from '../generated/graphql-test'
import { defaultMessages } from '@cy/i18n'
import SettingsContainer from './SettingsContainer.vue'

describe('<SettingsContainer />', { viewportHeight: 800, viewportWidth: 900 }, () => {
  it('renders', () => {
    cy.mountFragment(SettingsContainerFragmentDoc, { render: (gql) => <SettingsContainer gql={gql} /> })

    cy.contains('Project Settings').click()

    cy.findByText(defaultMessages.settingsPage.projectId.title).should('be.visible')
    cy.findByText(defaultMessages.settingsPage.config.title).should('be.visible').click()
  })

  it('renders a footer', () => {
    cy.mountFragment(SettingsContainerFragmentDoc, { render: (gql) => <SettingsContainer gql={gql} /> })
    cy.findByText(defaultMessages.settingsPage.footer.text)
    cy.findByText(defaultMessages.settingsPage.footer.button)
  })
})
