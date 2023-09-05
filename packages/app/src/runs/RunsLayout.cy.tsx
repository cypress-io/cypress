import RunsLayout from './RunsLayout.vue'
import { RunsContainerFragmentDoc } from '../generated/graphql-test'

const statuses = ['CANCELLED', 'ERRORED', 'FAILED', 'NOTESTS', 'OVERLIMIT', 'PASSED', 'RUNNING', 'TIMEDOUT']

describe('<RunsLayout />', () => {
  context('grouped runs when isUsingGit is true', () => {
    it('displays commits grouped by sha', () => {
      const shas: string[] = []

      cy.mountFragment(RunsContainerFragmentDoc, {
        render (gqlVal) {
          const runs = gqlVal.currentProject?.cloudProject?.__typename === 'CloudProject' ? gqlVal.currentProject.cloudProject.runs?.nodes : undefined

          for (let i = 0; i < statuses.length; i += 1) {
            const runSha = runs?.[i]?.commitInfo?.sha

            if (runSha) {
              shas.push(runSha)
            }
          }

          return (
            <RunsLayout
              runs={runs}
              allRunIds={['some-id']}
              isUsingGit={true}
              latestRunUrl="http://local.com"
              currentCommitInfo={{ sha: 'new-sha', message: 'a message' }}
            />
          )
        },
      })

      cy.get(`[data-cy="runsLayout-git"`).should('be.visible')
      cy.get(`[data-cy="runsLayout-no-git"`).should('not.exist')
      cy.wrap(shas).each((sha: string, index) => {
        cy.get(`[data-cy="commit-${sha}"`)
        .should('be.visible')
        .contains(`fix: make gql work ${statuses[index]}`).should('be.visible')
      })
    })

    it('hides View Runs button when latestRunUrl not present', () => {
      cy.mountFragment(RunsContainerFragmentDoc, {
        render (gqlVal) {
          const runs = gqlVal.currentProject?.cloudProject?.__typename === 'CloudProject' ? gqlVal.currentProject.cloudProject.runs?.nodes : undefined

          return (
            <RunsLayout
              runs={runs}
              allRunIds={['some-id']}
              isUsingGit={true}
              currentCommitInfo={{ sha: 'new-sha', message: 'a message' }}
            />
          )
        },
      })

      cy.get('[data-cy="open-cloud-latest').should('not.exist')
    })

    it('displays newer commit checked out', () => {
      cy.mountFragment(RunsContainerFragmentDoc, {
        render (gqlVal) {
          const runs = gqlVal.currentProject?.cloudProject?.__typename === 'CloudProject' ? gqlVal.currentProject.cloudProject.runs?.nodes : undefined

          return (
            <RunsLayout
              runs={runs}
              allRunIds={['some-id']}
              isUsingGit={true}
              latestRunUrl="http://local.com"
              currentCommitInfo={{ sha: 'new-sha', message: 'a message' }}
            />
          )
        },
      })

      cy.get('[data-cy="commit-new-sha"]').should('exist').contains('Checked out')
      cy.get('[data-cy="open-cloud-latest').should('be.visible').contains('View runs in Cypress Cloud')
      cy.wrap(statuses).each((status: string) => {
        cy.contains(`fix: make gql work ${ status}`).should('be.visible')
      })
    })

    it('displays first commit checked out', () => {
      let firstRunSha: string | null | undefined = null

      cy.mountFragment(RunsContainerFragmentDoc, {
        render (gqlVal) {
          const runs = gqlVal.currentProject?.cloudProject?.__typename === 'CloudProject' ? gqlVal.currentProject.cloudProject.runs?.nodes : undefined

          firstRunSha = runs?.[0].commitInfo?.sha

          return (
            <RunsLayout
              runs={runs}
              allRunIds={[]}
              isUsingGit={true}
              latestRunUrl="http://local.com"
              currentCommitInfo={{ sha: firstRunSha, message: 'a message' }}
            />
          )
        },
      })

      cy.then(() => {
        cy.get(`[data-cy="commit-${firstRunSha}"`).should('exist').contains('Checked out')
      })

      cy.get('[href="http://local.com"]').should('be.visible').contains('View runs in Cypress Cloud')
      cy.wrap(statuses).each((status: string) => {
        cy.contains(`fix: make gql work ${ status}`).should('be.visible')
      })
    })

    it('displays debug button enabled when allRunIds populated', () => {
      let firstRunId: string | undefined = undefined
      let secondRunId: string | undefined = undefined
      let thirdRunId: string | undefined = undefined

      cy.mountFragment(RunsContainerFragmentDoc, {
        render (gqlVal) {
          const runs = gqlVal.currentProject?.cloudProject?.__typename === 'CloudProject' ? gqlVal.currentProject.cloudProject.runs?.nodes : undefined

          firstRunId = runs?.[0].id
          secondRunId = runs?.[1].id
          thirdRunId = runs?.[2].id

          return (
            <RunsLayout
              runs={runs}
              allRunIds={[firstRunId, secondRunId]}
              isUsingGit={true}
              latestRunUrl="http://local.com"
              currentCommitInfo={{ sha: 'some-sha', message: 'a message' }}
            />
          )
        },
      })

      cy.then(() => {
        cy.get(`[data-cy="runCard-${firstRunId}"`).should('exist').contains('Debug').should('be.enabled')
        cy.get(`[data-cy="runCard-${secondRunId}"`).should('exist').contains('Debug').should('be.enabled')
        cy.get(`[data-cy="runCard-${thirdRunId}"`).should('exist').contains('Debug').should('not.be.enabled')
      })

      cy.get('[href="http://local.com"]').should('be.visible').contains('View runs in Cypress Cloud')
      cy.wrap(statuses).each((status: string) => {
        cy.contains(`fix: make gql work ${ status}`).should('be.visible')
      })
    })
  })

  context('block runs when isUsingGit is false', () => {
    it('displays in block layout', () => {
      cy.mountFragment(RunsContainerFragmentDoc, {
        render (gqlVal) {
          const runs = gqlVal.currentProject?.cloudProject?.__typename === 'CloudProject' ? gqlVal.currentProject.cloudProject.runs?.nodes : undefined

          return (
            <RunsLayout
              runs={runs}
              allRunIds={['some-id']}
            />
          )
        },
      })

      cy.get(`[data-cy="runsLayout-git"`).should('not.exist')
      cy.get(`[data-cy="runsLayout-no-git"`).should('be.visible')
    })
  })
})
