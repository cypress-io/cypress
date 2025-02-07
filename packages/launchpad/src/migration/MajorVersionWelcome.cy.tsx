// tslint:disable-next-line: no-implicit-dependencies - need to handle this
import { defaultMessages } from '@cy/i18n'
import MajorVersionWelcome from './MajorVersionWelcome.vue'
import interval from 'human-interval'
import { GET_MAJOR_VERSION_FOR_CONTENT } from '@packages/types'

const text = defaultMessages.majorVersionWelcome

describe('<MajorVersionWelcome />', { viewportWidth: 1280, viewportHeight: 1400 }, () => {
  it('renders expected interactive content', () => {
    const continueStub = cy.stub().as('clearLandingPage')

    // @ts-expect-error
    cy.mount(<MajorVersionWelcome onClearLandingPage={continueStub}/>)

    cy.contains('h1', 'What\'s New in Cypress').should('be.visible')

    cy.get('[data-cy="release-highlights"]').within(() => {
      cy.contains('a[href="https://on.cypress.io/changelog?utm_source=Binary%3A+App&utm_medium=splash-page&utm_campaign=v14#14-0-0"]', '14.0.0')
      cy.contains('a[href="https://on.cypress.io/changelog?utm_source=Binary%3A+App&utm_medium=splash-page&utm_campaign=v14#14-0-0"]', 'changelog')
    })

    cy.get('[data-cy="previous-release-highlights"]').within(() => {
      cy.contains('a[href="https://on.cypress.io/changelog#13-0-0"]', '13.0.0')
      cy.contains('a[href="https://on.cypress.io/changelog#12-0-0"]', '12.0.0')
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
    cy.clock(Date.UTC(2025, 0, 16))
    cy.mount(<MajorVersionWelcome />)
    cy.contains('14.0.0 Released just now')
    cy.contains('13.0.0 Released last year')
    cy.contains('12.0.0 Released 2 years ago')
    cy.contains('11.0.0 Released 2 years ago')
    cy.contains('10.0.0 Released 3 years ago')
    cy.tick(interval('1 minute'))
    cy.contains('14.0.0 Released 1 minute ago')
    cy.tick(interval('1 month'))
    cy.contains('14.0.0 Released last month')
    cy.contains('13.0.0 Released last year')

    cy.viewport(1280, 500)

    cy.percySnapshot('content overflows inside box')
  })

  // Test is designed to fail as a signal when the next major version of Cypress is bumped in the package.json
  // to signal to the team that we need to create a splash page
  it('makes sure there is an entry for the current major release in the monorepo package.json version', () => {
    cy.mount(<MajorVersionWelcome />)
    const currentMajorVersion = GET_MAJOR_VERSION_FOR_CONTENT()

    cy.get('a').should('contain.text', `${currentMajorVersion}.0.0`)
  })
})
