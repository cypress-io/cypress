import { SettingsContainerFragmentDoc } from '../generated/graphql-test'
import { defaultMessages } from '@cy/i18n'
import SettingsContainer from './SettingsContainer.vue'

const mountSettingsContainer = () => cy.mountFragment(SettingsContainerFragmentDoc, { render: (gql) => <SettingsContainer gql={gql} /> })

beforeEach(() => mountSettingsContainer())

describe('<SettingsContainer />', { viewportHeight: 800, viewportWidth: 900 }, () => {
  it('renders sections collapsed by default', () => {
    cy.findByTestId('settings').should('be.visible')
    cy.findByTestId('setting-expanded-container').should('not.exist')

    cy.percySnapshot()
  })

  it('expands and collapses project settings', () => {
    cy.contains('Project Settings').click()

    cy.findByText(defaultMessages.settingsPage.experiments.title).scrollIntoView().should('be.visible')
    cy.findByText(defaultMessages.settingsPage.specPattern.title).scrollIntoView().should('be.visible')
    cy.findByText(defaultMessages.settingsPage.config.title).scrollIntoView().should('be.visible')
    cy.percySnapshot()
    cy.findByText('Project Settings').click()

    cy.findByText(defaultMessages.settingsPage.experiments.title).should('not.exist')
  })

  it('expands and collapses device settings', () => {
    cy.contains('Device Settings').click()

    cy.findByText(defaultMessages.settingsPage.editor.title).should('be.visible')
    cy.findByText(defaultMessages.settingsPage.proxy.title).should('be.visible')
    cy.findByText(defaultMessages.settingsPage.testingPreferences.title).should('be.visible')
    cy.percySnapshot()

    cy.findByText('Device Settings').click()

    cy.findByText(defaultMessages.settingsPage.editor.title).should('not.exist')
  })

  it('expands and collapses cloud settings', () => {
    cy.contains('Dashboard Settings').click()

    cy.findByText(defaultMessages.settingsPage.projectId.title).scrollIntoView().should('be.visible')
    cy.percySnapshot()
    cy.findByText('Dashboard Settings').click()

    cy.findByText(defaultMessages.settingsPage.projectId.title).should('not.exist')
  })

  it('renders footer with CTA button', () => {
    cy.contains('p', defaultMessages.settingsPage.footer.text.replace('{testingType}', 'E2E'))
    cy.contains('a', defaultMessages.settingsPage.footer.button)
    .should('have.attr', 'href', defaultMessages.settingsPage.footer.buttonLink)
  })
})
