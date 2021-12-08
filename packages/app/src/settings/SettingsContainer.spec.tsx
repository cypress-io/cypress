import { SettingsContainerFragmentDoc } from '../generated/graphql-test'
import { defaultMessages } from '@cy/i18n'
import SettingsContainer from './SettingsContainer.vue'
import { useRoute } from 'vue-router'

describe('<SettingsContainer />', { viewportHeight: 800, viewportWidth: 900 }, () => {
  it('renders', () => {
    cy.mountFragment(SettingsContainerFragmentDoc, { render: (gql) => <SettingsContainer gql={gql} /> })

    cy.contains('Project Settings').click()

    cy.findByText(defaultMessages.settingsPage.projectId.title).should('be.visible')
    cy.findByText(defaultMessages.settingsPage.config.title).scrollIntoView().should('be.visible').click()
  })

  it('renders a footer', () => {
    cy.mountFragment(SettingsContainerFragmentDoc, { render: (gql) => <SettingsContainer gql={gql} /> })
    cy.findByText(defaultMessages.settingsPage.footer.text)
    cy.findByText(defaultMessages.settingsPage.footer.button)
  })

  context('scrolls to setting', () => {
    const sections = [
      { section: 'device',
        name: 'Device Settings',
        settings: ['editor', 'proxy', 'testingPreferences'],
      },
      { section: 'project',
        name: 'Project Settings',
        settings: ['projectId', 'recordKey', 'specPattern', 'experiments', 'config'],
      },
    ]

    sections.forEach(({ section, name, settings }) => settings.forEach((setting) => {
      it(`should scroll to ${setting}`, () => {
        cy.mountFragment(SettingsContainerFragmentDoc, {
          render: (gql) => {
            const route = useRoute()

            route.query.section = section
            route.query.setting = setting

            return <SettingsContainer gql={gql} />
          },
        })

        cy.get(`[data-cy="${name}"]`).within(() => {
          cy.get('[data-cy="collapsible-header"]').should('have.attr', 'aria-expanded', 'true')
          cy.contains(defaultMessages.settingsPage[section].title).should('be.visible')
        })
      })
    }))
  })
})
