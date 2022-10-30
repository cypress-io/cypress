import { defaultMessages } from '@cy/i18n'
import MajorVersionLandingPage from './MajorVersionLandingPage.vue'

const text = defaultMessages.migration.landingPage

describe('<MajorVersionLandingPage />', { viewportWidth: 1280, viewportHeight: 720 }, () => {
  const assertAllContentsVisible = () => {
    cy.contains('h1', text.title).should('be.visible')
    cy.contains('p', text.description).should('be.visible')
    cy.contains('a', text.linkReleaseNotes).should('be.visible')
    cy.contains('button', text.actionContinue).should('be.visible')
  }

  it('renders the content at large viewport', () => {
    const continueStub = cy.stub()

    cy.mount(<MajorVersionLandingPage onClearLandingPage={continueStub} />)
    .pause()

    assertAllContentsVisible()
    cy.contains('button', text.actionContinue).click()
    cy.wrap(continueStub).should('have.been.calledOnce')

    cy.percySnapshot()
  })

  it('is responsive on smaller viewports', () => {
    cy.mount(<MajorVersionLandingPage />)
    cy.viewport(500, 500)
    assertAllContentsVisible()
    cy.viewport(600, 600)

    cy.percySnapshot()
  })
})
