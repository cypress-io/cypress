import { SettingsContainerFragmentDoc } from '../generated/graphql-test'
import { defaultMessages } from '@cy/i18n'
import SettingsContainer from './SettingsContainer.vue'
import { useRoute, useRouter } from 'vue-router'

describe('<SettingsContainer />', { viewportHeight: 800, viewportWidth: 900 }, () => {
  const mountSettingsContainer = () => cy.mountFragment(SettingsContainerFragmentDoc, { render: (gql) => <SettingsContainer gql={gql} /> })

  it('renders', () => {
    mountSettingsContainer()
    cy.percySnapshot()
  })

  it('expands and collapses device settings', () => {
    mountSettingsContainer()

    cy.contains('Device Settings').click()

    cy.findByText(defaultMessages.settingsPage.editor.title).should('be.visible')
    cy.findByText(defaultMessages.settingsPage.proxy.title).should('be.visible')
    cy.findByText(defaultMessages.settingsPage.testingPreferences.title).should('be.visible')
    cy.percySnapshot()

    cy.findByText('Device Settings').click()

    cy.findByText(defaultMessages.settingsPage.editor.title).should('not.exist')
  })

  it('expands and collapses project settings', () => {
    mountSettingsContainer()

    cy.contains('Project Settings').click()

    cy.findByText(defaultMessages.settingsPage.projectId.title).scrollIntoView().should('be.visible')
    cy.findByText(defaultMessages.settingsPage.experiments.title).scrollIntoView().should('be.visible')
    cy.findByText(defaultMessages.settingsPage.specPattern.title).scrollIntoView().should('be.visible')
    cy.findByText(defaultMessages.settingsPage.config.title).scrollIntoView().should('be.visible')
    cy.percySnapshot()
    cy.findByText('Project Settings').click()

    cy.findByText(defaultMessages.settingsPage.projectId.title).should('not.exist')
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
            const router = useRouter()
            const route = useRoute()

            router.push({ path: '/settings', query: { section, setting } })

            route.query.section = section
            route.query.setting = setting

            return <SettingsContainer gql={gql} />
          },
        })

        cy.get(`[data-cy="${name}"]`).within(() => {
          cy.get('[data-cy="collapsible-header"]').should('have.attr', 'aria-expanded', 'true')
          cy.contains(defaultMessages.settingsPage[setting].title, { timeout: 10000 }).should('be.visible')
        })
      })
    }))
  })
})
