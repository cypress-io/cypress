import { defaultMessages } from '@cy/i18n'
import MajorVersionLandingPage from './MajorVersionLandingPage.vue'

const text = defaultMessages.majorVersionLandingPage

describe('<MajorVersionLandingPage />', { viewportWidth: 1280, viewportHeight: 1400 }, () => {
  it('renders expected interactive content', () => {
    const continueStub = cy.stub()

    cy.mount(<MajorVersionLandingPage onClearLandingPage={continueStub} />)

    cy.contains('h1', 'What\'s New in Cypress').should('be.visible')
    cy.contains('a[href="https://on.cypress.io/changelog"]', text.linkReleaseNotes).should('be.visible')
    cy.contains('a[href="https://on.cypress.io/changelog#11-0-0"]', '11.0.0').should('be.visible')
    cy.contains('a[href="https://on.cypress.io/changelog#10-0-0"]', '10.0.0').should('be.visible')

    cy.contains('button', text.actionContinue).should('be.visible')
    cy.contains('button', text.actionContinue).click()
    cy.wrap(continueStub).should('have.been.calledOnce')

    cy.percySnapshot('looks good at full size')

    cy.viewport(1280, 500)

    cy.percySnapshot('content overflows inside box')
  })
})
