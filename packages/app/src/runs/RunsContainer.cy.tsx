import RunsContainer from './RunsContainer.vue'
import { RunsContainerFragmentDoc } from '../generated/graphql-test'
import { useUserProjectStatusStore } from '@packages/frontend-shared/src/store/user-project-status-store'
// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these
import { defaultMessages } from '@cy/i18n'

describe('<RunsContainer />', { keystrokeDelay: 0 }, () => {
  context('when the user is logged in', () => {
    beforeEach(() => {
      const userProjectStatusStore = useUserProjectStatusStore()

      userProjectStatusStore.setUserFlag('isLoggedIn', true)
    })

    it('renders with expected runs if there is a cloud project id', () => {
      cy.mountFragment(RunsContainerFragmentDoc, {
        render (gqlVal) {
          const runs = gqlVal.currentProject?.cloudProject?.__typename === 'CloudProject' ? gqlVal.currentProject.cloudProject.runs?.nodes : undefined
          const runIds: string[] = runs?.[0]?.id ? [runs?.[0]?.id] : [] as string[]

          return <RunsContainer gql={gqlVal} runs={runs} online allRunIds={runIds} />
        },
      })

      const statuses = ['CANCELLED', 'ERRORED', 'FAILED', 'NOTESTS', 'OVERLIMIT', 'PASSED', 'RUNNING', 'TIMEDOUT']

      cy.wrap(statuses).each((status: string) => {
        cy.get(`[data-cy="runCard-status-${status}"]`).should('exist')
      })

      cy.percySnapshot()
    })

    it('renders instructions and "connect" link without a project id', () => {
      cy.mountFragment(RunsContainerFragmentDoc, {
        onResult: (result) => {
          if (result.currentProject?.projectId) {
            result.currentProject.projectId = ''
          }
        },
        render (gqlVal) {
          return <RunsContainer gql={gqlVal} online />
        },
      })

      const text = defaultMessages.runs.connect

      cy.contains(text.title).should('be.visible')
      cy.contains(text.buttonProject).should('be.visible')
      cy.percySnapshot()
    })
  })

  context('when the user is logged out', () => {
    it('renders instructions and login button', () => {
      cy.mountFragment(RunsContainerFragmentDoc, {
        render (gqlVal) {
          return <RunsContainer gql={gqlVal} online />
        },
      })

      const text = defaultMessages.runs.connect

      cy.contains(text.title).should('be.visible')
      cy.contains(text.buttonUser).should('be.visible')
      cy.percySnapshot()
    })
  })

  context('when the user has no recorded runs', () => {
    it('renders instructions and record prompt', () => {
      const userProjectStatusStore = useUserProjectStatusStore()

      userProjectStatusStore.setUserFlag('isLoggedIn', true)
      cy.mountFragment(RunsContainerFragmentDoc, {
        render (gqlVal) {
          return <RunsContainer gql={gqlVal} runs={[]} online />
        },
      })

      const text = defaultMessages.runs.empty

      cy.contains(text.title).should('be.visible')
    })
  })

  context('with errors', () => {
    it('renders connection failed', () => {
      const userProjectStatusStore = useUserProjectStatusStore()

      userProjectStatusStore.setUserFlag('isLoggedIn', true)
      cy.mountFragment(RunsContainerFragmentDoc, {
        onResult (result) {
          result.currentProject!.cloudProject = null
        },
        render (gqlVal) {
          return <RunsContainer gql={gqlVal} online onReExecuteRunsQuery={cy.spy().as('reExecuteRunsQuery')}/>
        },
      })

      const { title, description, link, button } = defaultMessages.runs.errors.connectionFailed

      cy.contains(title).should('be.visible')
      cy.contains(description.replace('{0}', link)).should('be.visible')
      cy.contains('a', link).should('have.attr', 'href', 'https://www.cypressstatus.com/')
      cy.contains('button', button).should('be.visible').click()

      cy.get('@reExecuteRunsQuery').should('have.been.called')

      cy.percySnapshot()
    })
  })

  context('when not using git', () => {
    it('renders alert message', () => {
      const userProjectStatusStore = useUserProjectStatusStore()

      userProjectStatusStore.setProjectFlag('isUsingGit', false)
      userProjectStatusStore.setUserFlag('isLoggedIn', true)

      cy.mountFragment(RunsContainerFragmentDoc, {
        render (gqlVal) {
          const cloudProject = gqlVal.currentProject?.cloudProject?.__typename === 'CloudProject' ? gqlVal.currentProject.cloudProject : undefined
          const runs = cloudProject?.runs ? cloudProject.runs.nodes : undefined

          return <RunsContainer gql={gqlVal} runs={runs} online />
        },
      })

      cy.get('h2').contains(defaultMessages.runs.empty.gitRepositoryNotDetected)
      cy.contains(defaultMessages.runs.empty.ensureGitSetupCorrectly)
    })

    it('dismisses the alert', () => {
      const userProjectStatusStore = useUserProjectStatusStore()

      userProjectStatusStore.setProjectFlag('isUsingGit', false)
      userProjectStatusStore.setUserFlag('isLoggedIn', true)

      cy.mountFragment(RunsContainerFragmentDoc, {
        render (gqlVal) {
          const cloudProject = gqlVal.currentProject?.cloudProject?.__typename === 'CloudProject' ? gqlVal.currentProject.cloudProject : undefined
          const runs = cloudProject?.runs ? cloudProject.runs.nodes : undefined

          return <RunsContainer gql={gqlVal} runs={runs} online />
        },
      })

      cy.get('h2').contains(defaultMessages.runs.empty.gitRepositoryNotDetected)
      cy.contains(defaultMessages.runs.empty.ensureGitSetupCorrectly)
      cy.get('[data-cy=alert-suffix-icon]').click()
      cy.get('[data-cy=alert-header]').should('not.exist')
    })
  })

  context('when using git but no runs for current branch', () => {
    it('renders alert message', () => {
      const { setUserFlag, setProjectFlag, cloudStatusMatches } = useUserProjectStatusStore()

      setUserFlag('isLoggedIn', true)
      setUserFlag('isMemberOfOrganization', true)
      setProjectFlag('isProjectConnected', true)
      setProjectFlag('hasNoRecordedRuns', true)
      setProjectFlag('hasNonExampleSpec', true)
      setProjectFlag('isConfigLoaded', true)
      setProjectFlag('isUsingGit', true)

      expect(cloudStatusMatches('needsRecordedRun'), 'status should be needsRecordedRun').equals(true)
      cy.mountFragment(RunsContainerFragmentDoc, {
        render (gqlVal) {
          const cloudProject = gqlVal.currentProject?.cloudProject?.__typename === 'CloudProject' ? gqlVal.currentProject.cloudProject : undefined
          const runs = cloudProject?.runs ? cloudProject.runs.nodes : undefined

          return <RunsContainer gql={gqlVal} runs={runs} online />
        },
      })

      cy.get('h2').contains(defaultMessages.runs.empty.noRunsFoundForBranch)
      cy.get('p').contains(defaultMessages.runs.empty.noRunsForBranchMessage)
      // The utm_source will be Binary%3A+App in production`open` mode but we assert using Binary%3A+Launchpad as this is the value in CI
      cy.contains(defaultMessages.links.learnMoreButton).should('have.attr', 'href', 'https://on.cypress.io/git-info?utm_source=Binary%3A+Launchpad&utm_medium=Runs+Tab&utm_campaign=No+Runs+Found')
    })

    it('dismisses the alert', () => {
      const { setUserFlag, setProjectFlag, cloudStatusMatches } = useUserProjectStatusStore()

      setUserFlag('isLoggedIn', true)
      setUserFlag('isMemberOfOrganization', true)
      setProjectFlag('isProjectConnected', true)
      setProjectFlag('hasNoRecordedRuns', true)
      setProjectFlag('hasNonExampleSpec', true)
      setProjectFlag('isConfigLoaded', true)
      setProjectFlag('isUsingGit', true)

      expect(cloudStatusMatches('needsRecordedRun')).equals(true)
      cy.mountFragment(RunsContainerFragmentDoc, {
        render (gqlVal) {
          const cloudProject = gqlVal.currentProject?.cloudProject?.__typename === 'CloudProject' ? gqlVal.currentProject.cloudProject : undefined
          const runs = cloudProject?.runs ? cloudProject.runs.nodes : undefined

          return <RunsContainer gql={gqlVal} runs={runs} online />
        },
      })

      cy.get('h2').contains(defaultMessages.runs.empty.noRunsFoundForBranch)
      cy.get('p').contains(defaultMessages.runs.empty.noRunsForBranchMessage)
      // The utm_source will be Binary%3A+App in production`open` mode but we assert using Binary%3A+Launchpad as this is the value in CI
      cy.contains(defaultMessages.links.learnMoreButton).should('have.attr', 'href', 'https://on.cypress.io/git-info?utm_source=Binary%3A+Launchpad&utm_medium=Runs+Tab&utm_campaign=No+Runs+Found')
      cy.get('[data-cy=alert-suffix-icon]').click()
      cy.get('[data-cy=alert-header]').should('not.exist')
    })
  })
})
