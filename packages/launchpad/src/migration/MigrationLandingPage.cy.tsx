import { defaultMessages } from '@cy/i18n'
import MigrationLandingPage from './MigrationLandingPage.vue'

const text = defaultMessages.migration.landingPage

describe('<MigrationLandingPage />', { viewportWidth: 1280, viewportHeight: 720 }, () => {
  const assertAllTextVisible = () => {
    cy.contains('h1', text.title).should('be.visible')
    cy.contains('p', text.description).should('be.visible')
    cy.contains('a', text.linkReleaseNotes).should('be.visible')
    cy.contains('button', text.actionContinue).should('be.visible')
  }

  const assertVideoSize = (width: number, height: number) => {
    cy.get('[data-cy="video-container"]').invoke('outerWidth').should('be.closeTo', width, 2)
    cy.get('[data-cy="video-container"]').invoke('outerHeight').should('be.closeTo', height, 2)
  }

  it('renders the content at large viewport', () => {
    const continueStub = cy.stub()

    cy.mount(<MigrationLandingPage onClearLandingPage={continueStub}/>)
    assertAllTextVisible()
    assertVideoSize(688, 387)
    cy.contains('button', text.actionContinue).click()
    cy.wrap(continueStub).should('have.been.calledOnce')

    cy.percySnapshot()
  })

  it('is responsive on smaller viewports', () => {
    cy.mount(<MigrationLandingPage/>)

    // asserting a few viewports here since it's prett
    cy.viewport(500, 500)
    assertAllTextVisible()
    assertVideoSize(400, 225)
    cy.viewport(600, 600)
    assertVideoSize(480, 270)

    cy.percySnapshot()
  })
})
