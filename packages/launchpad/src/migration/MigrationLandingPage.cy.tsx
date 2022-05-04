import { defaultMessages } from '@cy/i18n'
import MigrationLandingPage from './MigrationLandingPage.vue'

const text = defaultMessages.migration.landingPage

describe('<MigrationLandingPage />', { viewportWidth: 1280, viewportHeight: 720 }, () => {
  it('renders the content', () => {
    cy.mount(MigrationLandingPage)
    cy.contains('h1', text.title).should('be.visible')
    cy.contains('p', text.description).should('be.visible')
    cy.contains('button', text.actionContinue).should('be.visible')
    cy.contains('a', text.linkReleaseNotes).should('be.visible')
  })
})
