import DebugNotLoggedIn from './DebugNotLoggedIn.vue'
import DebugNoProject from './DebugNoProject.vue'
import DebugNoRuns from './DebugNoRuns.vue'
import DebugLoading from './DebugLoading.vue'
import DebugError from './DebugError.vue'
import DebugEmptyView from './DebugEmptyView.vue'
import { useLoginConnectStore } from '@packages/frontend-shared/src/store/login-connect-store'
import { DebugEmptyView_RecordEventDocument, DebugEmptyView_SetPreferencesDocument, UseCohorts_DetermineCohortDocument, _DebugEmptyViewFragment, _DebugEmptyViewFragmentDoc } from '../../generated/graphql-test'
import { DEBUG_SLIDESHOW } from '../utils/constants'

function mountWithGql (component: JSX.Element, gqlOptions?: { debugSlideshowComplete?: boolean, cohort?: 'A' | 'B' }) {
  let gql: _DebugEmptyViewFragment
  const opts = { debugSlideshowComplete: true, cohort: 'A', ...gqlOptions }

  cy.stubMutationResolver(UseCohorts_DetermineCohortDocument, (defineResult) => {
    return defineResult({ determineCohort: { __typename: 'Cohort', name: DEBUG_SLIDESHOW.id, cohort: opts.cohort } })
  })

  const recordEvent = cy.stub().as('recordEvent')
  const storeSlideshowComplete = cy.stub().as('storeSlideshowComplete')

  cy.stubMutationResolver(DebugEmptyView_RecordEventDocument, (defineResult, args) => {
    recordEvent(args)

    return defineResult({ recordEvent: true })
  })

  cy.stubMutationResolver(DebugEmptyView_SetPreferencesDocument, (defineResult, args) => {
    storeSlideshowComplete(args)

    return defineResult({
      setPreferences: {
        __typename: 'Query',
        currentProject: {
          __typename: 'CurrentProject',
          id: gql.currentProject?.id!,
          savedState: {
            debugSlideshowComplete: true,
          },
        },
      },
    })
  })

  cy.mountFragment(_DebugEmptyViewFragmentDoc, {
    onResult: (res) => {
      if (res.currentProject) {
        res.currentProject.savedState = {
          debugSlideshowComplete: opts.debugSlideshowComplete,
        }

        gql = res
      }
    },
    render: () => {
      return component
    },
  })
}

describe('Debug page empty states', () => {
  context('empty view', () => {
    it('renders with slot', () => {
      const slotVariableStub = cy.stub().as('slot')

      mountWithGql(
        <DebugEmptyView title="My Title">
          {{
            cta: slotVariableStub,
          }}
        </DebugEmptyView>,
      )

      cy.get('@slot').should('be.calledWith', { utmContent: Cypress.sinon.match.string })
    })
  })

  context('not logged in', () => {
    it('renders', () => {
      const loginConnectStore = useLoginConnectStore()

      // We need to set isLoggedIn so that CloudConnectButton shows the correct state
      loginConnectStore.setUserFlag('isLoggedIn', false)

      mountWithGql(<DebugNotLoggedIn />)

      cy.findByRole('link', { name: 'Learn more about debugging CI failures in Cypress' }).should('have.attr', 'href', 'https://on.cypress.io/debug-page?utm_source=Binary%3A+Launchpad&utm_medium=Debug+Tab&utm_campaign=Learn+More')

      cy.percySnapshot()
    })

    it('sends record event upon seeing slideshow', () => {
      useLoginConnectStore().setUserFlag('isLoggedIn', false)
      mountWithGql(<DebugNotLoggedIn />, { debugSlideshowComplete: false })
      cy.get('@recordEvent').should('have.been.calledWithMatch', { campaign: DEBUG_SLIDESHOW.campaigns.login, messageId: Cypress.sinon.match.string, medium: DEBUG_SLIDESHOW.medium, cohort: Cypress.sinon.match(/A|B/) })
    })
  })

  context('no project', () => {
    it('renders', () => {
      const loginConnectStore = useLoginConnectStore()

      // We need to set isLoggedIn so that CloudConnectButton shows the correct state
      loginConnectStore.setUserFlag('isLoggedIn', true)

      mountWithGql(<DebugNoProject />)

      cy.findByRole('link', { name: 'Learn more about project setup in Cypress' }).should('have.attr', 'href', 'https://on.cypress.io/adding-new-project?utm_source=Binary%3A+Launchpad&utm_medium=Debug+Tab&utm_campaign=Learn+More')

      cy.percySnapshot()

      cy.viewport(700, 700)

      cy.percySnapshot('responsive')
    })

    it('sends record event upon seeing slideshow', () => {
      useLoginConnectStore().setUserFlag('isLoggedIn', false)
      mountWithGql(<DebugNoProject />, { debugSlideshowComplete: false })
      cy.get('@recordEvent').should('have.been.calledWithMatch', { campaign: DEBUG_SLIDESHOW.campaigns.connectProject, messageId: Cypress.sinon.match.string, medium: DEBUG_SLIDESHOW.medium, cohort: Cypress.sinon.match(/A|B/) })
    })
  })

  context('no runs', () => {
    it('renders', () => {
      mountWithGql(<DebugNoRuns />)

      cy.findByRole('link', { name: 'Learn more about recording a run to Cypress Cloud' }).should('have.attr', 'href', 'https://on.cypress.io/cypress-run-record-key?utm_source=Binary%3A+Launchpad&utm_medium=Debug+Tab&utm_campaign=Learn+More')

      cy.percySnapshot()
    })

    it('sends record event upon seeing slideshow', () => {
      useLoginConnectStore().setUserFlag('isLoggedIn', false)
      mountWithGql(<DebugNoRuns />, { debugSlideshowComplete: false })
      cy.get('@recordEvent').should('have.been.calledWithMatch', { campaign: DEBUG_SLIDESHOW.campaigns.recordRun, messageId: Cypress.sinon.match.string, medium: DEBUG_SLIDESHOW.medium, cohort: Cypress.sinon.match(/A|B/) })
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

    it('does not render slideshow on error page', () => {
      mountWithGql(<DebugError />, { debugSlideshowComplete: false })
      cy.get('@recordEvent').should('not.have.been.called')
      cy.findByTestId('debug-default-empty-state').should('be.visible')
      cy.findByTestId('debug-slideshow-slide').should('not.exist')
    })
  })

  context('slideshow', () => {
    function moveThroughSlideshow (options: { cohort: 'A' | 'B', percy?: boolean }) {
      for (const step of [1, 2, 3]) {
        const { title, description } = cy.i18n.debugPage.emptyStates.slideshow[`step${step}`]
        const imageSrc = `debug-guide-${options.cohort === 'A' ? 'skeleton' : 'text'}-${step}.png`

        cy.findByAltText('Debug tutorial').should('have.attr', 'src').should('include', imageSrc)
        cy.contains('h2', title)
        cy.contains('p', description)
        cy.findByTestId('debug-slideshow-step').contains(`${step}/3`)
        cy.contains('button', 'Previous').should(step === 1 ? 'not.exist' : 'be.visible')
        if (options.percy) {
          cy.percySnapshot(`slideshow step ${step}`)
        }

        cy.contains('button', step === 3 ? 'Done' : 'Next').click()
      }

      cy.findByTestId('debug-slideshow-slide').should('not.exist')
    }

    it('renders slideshow if debugSlideshowComplete = false', () => {
      useLoginConnectStore().setUserFlag('isLoggedIn', false)
      mountWithGql(<DebugNoRuns />, { cohort: 'B', debugSlideshowComplete: false })
      cy.get('@recordEvent').should('have.been.calledWithMatch', { campaign: DEBUG_SLIDESHOW.campaigns.recordRun, messageId: Cypress.sinon.match.string, medium: DEBUG_SLIDESHOW.medium, cohort: Cypress.sinon.match(/A|B/) })
      moveThroughSlideshow({ cohort: 'B', percy: true })
      cy.get('@storeSlideshowComplete').should('have.been.called')

      // Can still move through slideshow, does not record events after completion
      cy.contains('button', 'Info').click()
      cy.get('@recordEvent').should('not.have.been.calledTwice')
      moveThroughSlideshow({ cohort: 'B' })
      cy.get('@storeSlideshowComplete').should('not.have.been.calledTwice')
    })

    it('renders default empty state if debugSlideshowComplete = true', () => {
      useLoginConnectStore().setUserFlag('isLoggedIn', false)
      mountWithGql(<DebugNoRuns />, { cohort: 'A', debugSlideshowComplete: true })
      cy.findByTestId('debug-default-empty-state')

      cy.contains('button', 'Info').click()
      moveThroughSlideshow({ cohort: 'A', percy: true })
    })
  })
})
