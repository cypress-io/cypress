import { defaultMessages } from '@cy/i18n'
import ConnectProjectBanner from './ConnectProjectBanner.vue'
import { TrackedBanner_RecordBannerSeenDocument } from '../../generated/graphql'

describe('<ConnectProjectBanner />', () => {
  it('should render expected content', () => {
    const copyOptions = [{ cohort: 'A', value: 'specPage.banners.connectProject.contentA' }]

    cy.mount({ render: () => <ConnectProjectBanner modelValue={true} bodyCopyOptions={copyOptions}/> })

    cy.contains(defaultMessages.specPage.banners.connectProject.title).should('be.visible')
    cy.contains(defaultMessages.specPage.banners.connectProject.contentA).should('be.visible')
    cy.contains(defaultMessages.specPage.banners.connectProject.buttonLabel).should('be.visible')

    cy.percySnapshot()
  })

  it('should record expected event on mount', () => {
    const recordEvent = cy.stub().as('recordEvent')

    cy.stubMutationResolver(TrackedBanner_RecordBannerSeenDocument, (defineResult, event) => {
      recordEvent(event)

      return defineResult({ recordEvent: true })
    })

    cy.mount({ render: () => <ConnectProjectBanner modelValue={true} hasBannerBeenShown={false} /> })

    cy.get('@recordEvent').should('have.been.calledWith', {
      campaign: 'Create project',
      medium: 'Specs Create Project Banner',
      messageId: Cypress.sinon.match.string,
      cohort: Cypress.sinon.match.string,
    })
  })
})
