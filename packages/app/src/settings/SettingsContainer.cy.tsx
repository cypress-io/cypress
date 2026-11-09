import { SettingsContainerFragmentDoc } from '../generated/graphql-test'
import SettingsContainer from './SettingsContainer.vue'

const mountSettingsContainer = () => cy.mountFragment(SettingsContainerFragmentDoc, { render: (gql) => <SettingsContainer gql={gql} /> })

beforeEach(() => mountSettingsContainer())

describe('<SettingsContainer />', { viewportHeight: 800, viewportWidth: 900 }, () => {
  it('renders sections collapsed by default', () => {
    cy.findByTestId('settings').should('be.visible')
    cy.findByTestId('setting-expanded-container').should('not.exist')
    cy.findByText('Experiments').should('not.exist')
    cy.findByText('External editor').should('not.exist')
    cy.findByText('Project ID').should('not.exist')
  })

  it('expands and collapses project settings', () => {
    cy.contains('Project settings').click()

    cy.findByText('Experiments').scrollIntoView().should('be.visible')
    cy.findByText('Spec patterns').scrollIntoView().should('be.visible')
    cy.findByText('Resolved configuration').scrollIntoView().should('be.visible')
    cy.findByText('Project settings').click()

    cy.findByText('Experiments').should('not.exist')
  })

  it('expands and collapses device settings', () => {
    cy.contains('Device settings').click()

    cy.findByText('External editor').should('be.visible')
    cy.findByText('Proxy settings').scrollIntoView().should('be.visible')
    cy.findByText('Desktop notifications').scrollIntoView().should('be.visible')
    cy.findByText('Testing preferences').scrollIntoView().should('be.visible')
    cy.percySnapshot()

    cy.findByText('Device settings').click()

    cy.findByText('External editor').should('not.exist')
  })

  it('expands and collapses cloud settings', () => {
    cy.contains('Cypress Cloud settings').click()

    cy.findByText('Project ID').scrollIntoView().should('be.visible')
    cy.findByText('Cypress Cloud settings').click()

    cy.findByText('Project ID').should('not.exist')
  })

  it('renders footer with CTA button', () => {
    cy.contains('p', 'You can reconfigure the E2E testing settings for this project if you\'re experiencing issues with your Cypress configuration.')
    cy.contains('a', 'Configuration guide')
    .should('have.attr', 'href', 'https://on.cypress.io/configuration?utm_medium=Settings&utm_campaign=Configuration+Guide&utm_source=Binary%3A+Launchpad')
  })
})
