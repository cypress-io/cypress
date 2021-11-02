import { SettingsContainerFragmentDoc } from '../generated/graphql-test'
import { defaultMessages } from '@cy/i18n'
import SettingsContainer from './SettingsContainer.vue'

describe('<SettingsContainer />', () => {
  it('renders', () => {
    cy.viewport(900, 800)
    cy.mountFragment(SettingsContainerFragmentDoc, { render: (gql) => <SettingsContainer gql={gql} /> })

    cy.contains('Project Settings').click()

    cy.findByText(defaultMessages.settingsPage.projectId.title).should('be.visible')
    cy.findByText(defaultMessages.settingsPage.config.title).should('be.visible').click()
  })
})
