// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these
import { defaultMessages } from '@cy/i18n'
import ConnectProjectBanner from './ConnectProjectBanner.vue'
import { TrackedBanner_RecordBannerSeenDocument } from '../../generated/graphql'

describe('<ConnectProjectBanner />', () => {
  const cohortOption = { cohort: '', value: defaultMessages.specPage.banners.connectProject.content }

  it('should render expected content', () => {
    cy.mount({ render: () => <ConnectProjectBanner hasBannerBeenShown={true} cohortOption={cohortOption}/> })

    cy.contains(defaultMessages.specPage.banners.connectProject.title).should('be.visible')
    cy.contains(defaultMessages.specPage.banners.connectProject.content).should('be.visible')
    cy.contains(defaultMessages.specPage.banners.connectProject.buttonLabel).should('be.visible')

    cy.percySnapshot()
  })

  context('events', () => {
    beforeEach(() => {
      const recordEvent = cy.stub().as('recordEvent')

      cy.stubMutationResolver(TrackedBanner_RecordBannerSeenDocument, (defineResult, event) => {
        recordEvent(event)

        return defineResult({ recordEvent: true })
      })
    })

    it('should record expected event on mount', () => {
      cy.mount({ render: () => <ConnectProjectBanner hasBannerBeenShown={false} cohortOption={cohortOption}/> })

      cy.get('@recordEvent').should('have.been.calledWith', {
        campaign: 'Create project',
        medium: 'Specs Create Project Banner',
        messageId: Cypress.sinon.match.string,
        cohort: null,
      })
    })

    it('should not record event on mount if already shown', () => {
      cy.mount({ render: () => <ConnectProjectBanner hasBannerBeenShown={true} cohortOption={cohortOption}/> })

      cy.get('@recordEvent').should('not.have.been.called')
    })
  })
})
