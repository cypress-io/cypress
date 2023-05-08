import DebugNotLoggedIn from './DebugNotLoggedIn.vue'
import DebugNoProject from './DebugNoProject.vue'
import DebugNoRuns from './DebugNoRuns.vue'
import DebugLoading from './DebugLoading.vue'
import DebugError from './DebugError.vue'
import DebugEmptyView from './DebugEmptyView.vue'
import { useUserProjectStatusStore } from '@packages/frontend-shared/src/store/user-project-status-store'
import { Promo_PromoSeenDocument, _PromoFragmentDoc } from '../../generated/graphql-test'
import { DEBUG_PROMO_CAMPAIGNS, DEBUG_TAB_MEDIUM } from '../utils/constants'

function mountWithGql (component: JSX.Element) {
  const recordEvent = cy.stub().as('recordEvent')

  cy.stubMutationResolver(Promo_PromoSeenDocument, (defineResult, args) => {
    recordEvent(args)

    return defineResult({ recordEvent: true })
  })

  cy.mountFragment(_PromoFragmentDoc, {
    render: () => {
      return component
    },
  })
}

describe('Debug page empty states', { defaultCommandTimeout: 250 }, () => {
  context('empty view', () => {
    it('renders with slot', () => {
      const slotVariableStub = cy.stub().as('slot')

      mountWithGql(
        <DebugEmptyView title="My Title" cohort="Z">
          {{
            cta: slotVariableStub,
          }}
        </DebugEmptyView>,
      )

      cy.get('@slot').should('be.calledWith', { utmContent: 'Z' })
    })
  })

  context('not logged in', () => {
    it('renders', () => {
      const useUserProjectStatusStore = useUserProjectStatusStore()

      // We need to set isLoggedIn so that CloudConnectButton shows the correct state
      useUserProjectStatusStore.setUserFlag('isLoggedIn', false)

      mountWithGql(<DebugNotLoggedIn />)

      cy.percySnapshot()
    })

    context('slideshow', () => {
      function moveThroughSlideshow (options: { percy?: boolean }) {
        for (const step of [1, 2, 3]) {
          const { title, description } = cy.i18n.debugPage.emptyStates.slideshow[`step${step}`]

          cy.contains(title)
          cy.contains(description)
          if (options.percy) {
            cy.percySnapshot(`slideshow step ${step}`)
          }

          cy.get('[data-cy="promo-action"]:visible').last().click()
        }
      }

      it('renders slideshow', () => {
        useUserProjectStatusStore().setUserFlag('isLoggedIn', false)
        mountWithGql(<DebugNotLoggedIn />)
        cy.get('@recordEvent').should('have.been.calledWithMatch', { campaign: DEBUG_PROMO_CAMPAIGNS.login, messageId: Cypress.sinon.match.string, medium: DEBUG_TAB_MEDIUM, cohort: null })
        moveThroughSlideshow({ percy: true })

        // Can repeat moving through slideshow once complete
        // Should not re-record slideshow being seen
        cy.get('@recordEvent').should('not.have.been.calledTwice')
        moveThroughSlideshow({ })
      })

      it('sends record event upon seeing slideshow', () => {
        useUserProjectStatusStore().setUserFlag('isLoggedIn', false)
        mountWithGql(<DebugNotLoggedIn />)
        cy.get('@recordEvent').should('have.been.calledWithMatch', { campaign: DEBUG_PROMO_CAMPAIGNS.login, messageId: Cypress.sinon.match.string, medium: DEBUG_TAB_MEDIUM, cohort: null })
      })
    })
  })

  context('no project', () => {
    it('renders', () => {
      const useUserProjectStatusStore = useUserProjectStatusStore()

      // We need to set isLoggedIn so that CloudConnectButton shows the correct state
      useUserProjectStatusStore.setUserFlag('isLoggedIn', true)

      mountWithGql(<DebugNoProject />)

      cy.findByRole('link', { name: 'Learn more about project setup in Cypress' }).should('have.attr', 'href', 'https://on.cypress.io/adding-new-project?utm_source=Binary%3A+Launchpad&utm_medium=Debug+Tab&utm_campaign=Learn+More')

      cy.percySnapshot()

      cy.viewport(700, 700)

      cy.percySnapshot('responsive')
    })
  })

  context('no runs', () => {
    it('renders', () => {
      mountWithGql(<DebugNoRuns />)

      cy.findByText('Copy the command below to record your first run').should('be.visible')

      cy.percySnapshot()
    })
  })

  context('loading', () => {
    it('renders', () => {
      mountWithGql(<DebugLoading />)

      cy.percySnapshot()
    })
  })

  context('error', () => {
    it('renders', () => {
      mountWithGql(<DebugError />)

      cy.findByRole('link', { name: 'Learn more about debugging CI failures in Cypress' }).should('have.attr', 'href', 'https://on.cypress.io/debug-page?utm_source=Binary%3A+Launchpad&utm_medium=Debug+Tab&utm_campaign=Learn+More')

      cy.percySnapshot()
    })
  })
})
