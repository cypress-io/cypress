import ConnectProjectBanner from './ConnectProjectBanner.vue'
import { TrackedBanner_RecordBannerSeenDocument } from '../../generated/graphql'

describe('<ConnectProjectBanner />', () => {
  const cohortOption = { cohort: '', value: 'Bring your recorded test results into your local development workflow to monitor, run, and fix tests all in the Cypress app.' }

  it('should render expected content', () => {
    cy.mount({ render: () => <ConnectProjectBanner hasBannerBeenShown={true} cohortOption={cohortOption}/> })

    cy.contains('Connect your project to Cypress Cloud').should('be.visible')
    cy.contains('Bring your recorded test results into your local development workflow to monitor, run, and fix tests all in the Cypress app.').should('be.visible')
    cy.contains('Connect your project').should('be.visible')

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
        includeMachineId: false,
      })
    })

    it('should not record event on mount if already shown', () => {
      cy.mount({ render: () => <ConnectProjectBanner hasBannerBeenShown={true} cohortOption={cohortOption}/> })

      cy.get('@recordEvent').should('not.have.been.called')
    })
  })
})
