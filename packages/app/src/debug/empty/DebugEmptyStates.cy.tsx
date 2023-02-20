import DebugNotLoggedIn from './DebugNotLoggedIn.vue'
import DebugNoProject from './DebugNoProject.vue'
import DebugNoRuns from './DebugNoRuns.vue'
import DebugLoading from './DebugLoading.vue'
import DebugError from './DebugError.vue'
import { useLoginConnectStore } from '@packages/frontend-shared/src/store/login-connect-store'
import { DebugEmptyView_RecordEventDocument, DebugEmptyView_SetPreferencesDocument, UseCohorts_DetermineCohortDocument, _DebugEmptyViewFragment, _DebugEmptyViewFragmentDoc } from '../../generated/graphql-test'
import { DebugSlideshowCampaigns, DEBUG_SLIDESHOW } from '../utils/constants'

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

function moveThroughSlideshow (cohortOptions: { cohort: 'A' | 'B', campaign: DebugSlideshowCampaigns }) {
  for (const step of [1, 2, 3]) {
    const { title, description } = cy.i18n.debugPage.emptyStates.slideshow[`step${step}`]
    const imageSrc = `debug-guide-${cohortOptions.cohort === 'A' ? 'skeleton' : 'text'}-${step}.png`

    cy.findByAltText('Debug tutorial').should('have.attr', 'src').should('include', imageSrc)
    cy.contains('h2', title)
    cy.contains('p', description)
    cy.findByTestId('debug-slideshow-step').contains(`${step}/3`)
    cy.contains('button', 'Previous').should(step === 1 ? 'not.exist' : 'be.visible')
    cy.contains('button', step === 3 ? 'Done' : 'Next').click()
  }

  cy.findByTestId('debug-slideshow-slide').should('not.exist')
}

describe('Debug page empty states', () => {
  context('not logged in', () => {
    it('renders', () => {
      const loginConnectStore = useLoginConnectStore()

      // We need to set isLoggedIn so that CloudConnectButton shows the correct state
      loginConnectStore.setUserFlag('isLoggedIn', false)

      mountWithGql(<DebugNotLoggedIn />)

      cy.findByRole('link', { name: 'Learn about debugging CI failures in Cypress' }).should('have.attr', 'href', 'https://on.cypress.io/debug-page?utm_source=Binary%3A+Launchpad&utm_medium=Debug+Tab&utm_campaign=Learn+More')

      cy.percySnapshot()
    })

    it('sends record event upon seeing slideshow', () => {
      useLoginConnectStore().setUserFlag('isLoggedIn', false)
      mountWithGql(<DebugNotLoggedIn />, { debugSlideshowComplete: false })
      cy.get('@recordEvent').should('have.been.calledWithMatch', { campaign: DEBUG_SLIDESHOW.campaigns.login })
      moveThroughSlideshow({ cohort: 'A', campaign: DEBUG_SLIDESHOW.campaigns.login })
    })
  })

  context('no project', () => {
    it('renders', () => {
      const loginConnectStore = useLoginConnectStore()

      // We need to set isLoggedIn so that CloudConnectButton shows the correct state
      loginConnectStore.setUserFlag('isLoggedIn', true)

      mountWithGql(<DebugNoProject />)

      cy.findByRole('link', { name: 'Learn about project setup in Cypress' }).should('have.attr', 'href', 'https://on.cypress.io/adding-new-project?utm_source=Binary%3A+Launchpad&utm_medium=Debug+Tab&utm_campaign=Learn+More')

      cy.percySnapshot()

      cy.viewport(700, 700)

      cy.percySnapshot('responsive')
    })

    it('sends record event upon seeing slideshow', () => {
      useLoginConnectStore().setUserFlag('isLoggedIn', false)
      mountWithGql(<DebugNoProject />, { debugSlideshowComplete: false })
      cy.get('@recordEvent').should('have.been.calledWithMatch', { campaign: DEBUG_SLIDESHOW.campaigns.connectProject })
      moveThroughSlideshow({ cohort: 'A', campaign: DEBUG_SLIDESHOW.campaigns.connectProject })
    })
  })

  context('no runs', () => {
    it('renders', () => {
      mountWithGql(<DebugNoRuns />)

      cy.findByRole('link', { name: 'Learn about recording a run to Cypress Cloud' }).should('have.attr', 'href', 'https://on.cypress.io/cypress-run-record-key?utm_source=Binary%3A+Launchpad&utm_medium=Debug+Tab&utm_campaign=Learn+More')

      cy.percySnapshot()
    })

    it('sends record event upon seeing slideshow', () => {
      useLoginConnectStore().setUserFlag('isLoggedIn', false)
      mountWithGql(<DebugNoRuns />, { debugSlideshowComplete: false })
      cy.get('@recordEvent').should('have.been.calledWithMatch', { campaign: DEBUG_SLIDESHOW.campaigns.recordRun })
      moveThroughSlideshow({ cohort: 'A', campaign: DEBUG_SLIDESHOW.campaigns.recordRun })
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

      cy.findByRole('link', { name: 'Learn about debugging CI failures in Cypress' }).should('have.attr', 'href', 'https://on.cypress.io/debug-page?utm_source=Binary%3A+Launchpad&utm_medium=Debug+Tab&utm_campaign=Learn+More')

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
    it('renders slideshow if debugSlideshowComplete = false', () => {
      useLoginConnectStore().setUserFlag('isLoggedIn', false)
      mountWithGql(<DebugNoRuns />, { cohort: 'B', debugSlideshowComplete: false })
      cy.get('@recordEvent').should('have.been.calledWithMatch', { campaign: DEBUG_SLIDESHOW.campaigns.recordRun })
      moveThroughSlideshow({ cohort: 'B', campaign: DEBUG_SLIDESHOW.campaigns.recordRun })
      cy.get('@storeSlideshowComplete').should('have.been.called')

      // Can still move through slideshow, does not record events after completion
      cy.contains('button', 'Info').click()
      cy.get('@recordEvent').should('not.have.been.calledTwice')
      moveThroughSlideshow({ cohort: 'B', campaign: DEBUG_SLIDESHOW.campaigns.recordRun })
      cy.get('@storeSlideshowComplete').should('not.have.been.calledTwice')
    })

    it('renders default empty state if debugSlideshowComplete = true', () => {
      useLoginConnectStore().setUserFlag('isLoggedIn', false)
      mountWithGql(<DebugNoRuns />, { cohort: 'B', debugSlideshowComplete: true })
      cy.findByTestId('debug-default-empty-state')
    })
  })
})
