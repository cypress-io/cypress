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
      const userProjectStatusStore = useUserProjectStatusStore()

      // We need to set isLoggedIn so that CloudConnectButton shows the correct state
      userProjectStatusStore.setUserFlag('isLoggedIn', false)

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

          // ensure the promos are done transitioning before clicking on the control
          // since 2 buttons could display if both promos are easing in and out
          cy.findAllByTestId('guide-card', { timeout: 350 }).should('not.have.class', 'ease-in')
          .and('not.have.class', 'ease-out')

          cy.findByTestId('promo-action-control').click()
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
      const userProjectStatusStore = useUserProjectStatusStore()

      // We need to set isLoggedIn so that CloudConnectButton shows the correct state
      userProjectStatusStore.setUserFlag('isLoggedIn', true)

      mountWithGql(<DebugNoProject />)

      cy.percySnapshot()
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

  context('not using git', () => {
    it('renders', () => {
      mountWithGql(<DebugError />)
      cy.findByText('Git repository not detected').should('be.visible')
      cy.percySnapshot()
    })
  })
})
