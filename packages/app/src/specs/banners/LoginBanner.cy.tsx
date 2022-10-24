import { defaultMessages } from '@cy/i18n'
import LoginBanner from './LoginBanner.vue'
import { TrackedBanner_RecordBannerSeenDocument } from '../../generated/graphql'

describe('<LoginBanner />', () => {
  const cohortOption = { cohort: 'A', value: defaultMessages.specPage.banners.login.contentA }

  it('should render expected content', () => {
    cy.mount({ render: () => <LoginBanner hasBannerBeenShown={true} cohortOption={cohortOption}/> })

    cy.contains(defaultMessages.specPage.banners.login.title).should('be.visible')
    cy.contains(defaultMessages.specPage.banners.login.contentA).should('be.visible')
    cy.contains(defaultMessages.specPage.banners.login.buttonLabel).should('be.visible')

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
      cy.mount({ render: () => <LoginBanner hasBannerBeenShown={false} cohortOption={cohortOption}/> })

      cy.get('@recordEvent').should('have.been.calledWith', {
        campaign: 'Log In',
        medium: 'Specs Login Banner',
        messageId: Cypress.sinon.match.string,
        cohort: cohortOption.cohort,
      })
    })

    it('should not record event on mount if already shown', () => {
      cy.mount({ render: () => <LoginBanner hasBannerBeenShown={true} cohortOption={cohortOption}/> })

      cy.get('@recordEvent').should('not.have.been.called')
    })
  })
})
