import { defaultMessages } from '@cy/i18n'
import MajorVersionLandingPage from './MajorVersionLandingPage.vue'

const text = defaultMessages.migration.landingPage

describe('<MajorVersionLandingPage />', { viewportWidth: 1280, viewportHeight: 720 }, () => {
  const assertAllContentsVisible = () => {
    cy.contains('h1', text.title).should('be.visible')
    cy.contains('p', text.description).should('be.visible')
    cy.contains('a', text.linkReleaseNotes).should('be.visible')
    cy.contains('button', text.actionContinue).should('be.visible')
    cy.get('[data-cy="video-frame"]').should('be.visible')
  }

  const assertVideoSize = (width: number, height: number) => {
    cy.get('[data-cy="video-container"]').invoke('outerWidth').should('be.closeTo', width, 2)
    cy.get('[data-cy="video-container"]').invoke('outerHeight').should('be.closeTo', height, 2)
  }

  const testVideoHtml = '<iframe class="rounded h-full bg-gray-1000 w-full" data-cy="video-frame" frameborder="0"/>'

  it('renders the content at large viewport', () => {
    const continueStub = cy.stub()

    cy.mount(<MajorVersionLandingPage onClearLandingPage={continueStub} videoHtml={testVideoHtml}/>)
    assertAllContentsVisible()
    assertVideoSize(680, 408)
    cy.contains('button', text.actionContinue).click()
    cy.wrap(continueStub).should('have.been.calledOnce')

    cy.percySnapshot()
  })

  it('is responsive on smaller viewports', () => {
    cy.mount(<MajorVersionLandingPage videoHtml={testVideoHtml}/>)

    // asserting a few viewports here since it's pretty easy to accidentally remove aspect ratio css
    // and not notice right away
    cy.viewport(500, 500)
    assertAllContentsVisible()
    assertVideoSize(392, 235)
    cy.viewport(600, 600)
    assertVideoSize(472, 283)

    cy.percySnapshot()
  })
})
