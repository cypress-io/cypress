import { defaultMessages } from '@cy/i18n'
import MajorVersionWelcome from './MajorVersionWelcome.vue'
import interval from 'human-interval'

const text = defaultMessages.majorVersionWelcome

describe('<MajorVersionWelcome />', { viewportWidth: 1280, viewportHeight: 1400 }, () => {
  it('renders expected interactive content', () => {
    const continueStub = cy.stub().as('clearLandingPage')

    cy.mount(<MajorVersionWelcome onClearLandingPage={continueStub} />)

    cy.contains('h1', 'What\'s New in Cypress').should('be.visible')

    cy.get('[data-cy="release-highlights"]').within(() => {
      cy.contains('a[href="https://on.cypress.io/changelog#12-0-0"]', '12.0.0')
      cy.contains('a[href="https://on.cypress.io/changelog#12-0-0"]', 'changelog')
      cy.contains('a[href="https://on.cypress.io/migration-guide#Migrating-to-Cypress-12-0"]', 'Migration Guide')

      cy.contains('a[href="https://on.cypress.io/origin"]', 'cy.origin()')
      cy.contains('a[href="https://on.cypress.io/session"]', 'cy.session()')
      cy.contains('a[href="https://on.cypress.io/retry-ability"]', 'Retry-ability Guide')
    })

    cy.get('[data-cy="previous-release-highlights"]').within(() => {
      cy.contains('a[href="https://on.cypress.io/changelog#11-0-0"]', '11.0.0')
      cy.contains('a[href="https://on.cypress.io/changelog#10-0-0"]', '10.0.0')
    })

    cy.get('[data-cy="major-version-welcome-footer"]').within(() => {
      cy.contains('a[href="https://on.cypress.io/changelog"]', text.linkReleaseNotes)
      cy.contains('button', text.actionContinue).scrollIntoView()
      cy.contains('button', text.actionContinue).click()
    })

    cy.wrap(continueStub).should('have.been.calledOnce')
  })

  it('renders correct time for releases and overflows correctly', () => {
    cy.clock(Date.UTC(2022, 10, 8))
    cy.mount(<MajorVersionWelcome />)
    cy.contains('11.0.0 Released just now')
    cy.contains('10.0.0 Released 5 months ago')
    cy.tick(interval('1 minute'))
    cy.contains('11.0.0 Released 1 minute ago')
    cy.tick(interval('1 month'))
    cy.contains('11.0.0 Released last month')
    cy.contains('10.0.0 Released 6 months ago')

    cy.viewport(1280, 500)

    cy.percySnapshot('content overflows inside box')
  })
})
