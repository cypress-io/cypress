import { SettingsContainerFragmentDoc } from '../generated/graphql-test'
import { defaultMessages } from '@cy/i18n'
import SettingsContainer from './SettingsContainer.vue'

describe('<SettingsContainer />', { viewportHeight: 800, viewportWidth: 900 }, () => {
  beforeEach(() => {
    cy.mountFragment(SettingsContainerFragmentDoc, { render: (gql) => <SettingsContainer gql={gql} /> })
  })

  it('expands and collapses device settings', () => {
    cy.contains('Device Settings').click()

    cy.findByText(defaultMessages.settingsPage.editor.title).should('be.visible')
    cy.findByText(defaultMessages.settingsPage.proxy.title).should('be.visible')
    cy.findByText(defaultMessages.settingsPage.testingPreferences.title).should('be.visible')

    cy.findByText('Device Settings').click()

    cy.findByText(defaultMessages.settingsPage.editor.title).should('not.exist')
  })

  it('expands and collapses project settings', () => {
    cy.contains('Project Settings').click()

    cy.findByText(defaultMessages.settingsPage.projectId.title).should('be.visible')
    cy.findByText(defaultMessages.settingsPage.experiments.title).should('be.visible')
    cy.findByText(defaultMessages.settingsPage.specPattern.title).should('be.visible')
    cy.findByText(defaultMessages.settingsPage.config.title).should('be.visible')

    cy.findByText('Project Settings').click()

    cy.findByText(defaultMessages.settingsPage.projectId.title).should('not.exist')
  })
})
