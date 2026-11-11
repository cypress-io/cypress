import LoginBanner from './LoginBanner.vue'
import { TrackedBanner_RecordBannerSeenDocument } from '../../generated/graphql'

describe('<LoginBanner />', () => {
  const cohortOption = { cohort: '', value: 'When you configure Cypress to record tests to Cypress Cloud, you\'ll see data from your latest recorded runs in the Cypress app. This increased visibility into your test history allows you to debug your tests faster and more effectively, all within your local workflow.' }

  it('should render expected content', () => {
    cy.mount({ render: () => <LoginBanner hasBannerBeenShown={true} cohortOption={cohortOption}/> })

    cy.contains('Optimize and record your CI test runs with Cypress Cloud').should('be.visible')
    cy.contains('When you configure Cypress to record tests to Cypress Cloud, you\'ll see data from your latest recorded runs in the Cypress app. This increased visibility into your test history allows you to debug your tests faster and more effectively, all within your local workflow.').should('be.visible')
    cy.contains('Get started with Cypress Cloud').should('be.visible')

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
        cohort: null,
        includeMachineId: false,
      })
    })

    it('should not record event on mount if already shown', () => {
      cy.mount({ render: () => <LoginBanner hasBannerBeenShown={true} cohortOption={cohortOption}/> })

      cy.get('@recordEvent').should('not.have.been.called')
    })
  })
})
