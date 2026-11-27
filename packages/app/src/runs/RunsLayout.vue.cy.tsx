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
              latestRunUrl="https://cypress.io"
              currentCommitInfo={{ sha: 'new-sha', message: 'a message' }}
            />
          )
        },
      })

      cy.get(`[data-cy="runsLayout-git"`).should('be.visible')
      cy.get(`[data-cy="runsLayout-no-git"`).should('not.exist')
      cy.get(`[data-cy="runsLayout-git"`).children('li').should('have.length', 21).each((item, index) => {
        if (index === 0) {
          cy.wrap(item).should('be.visible').contains('a message')
        } else {
          cy.wrap(item).should('be.visible').contains(`fix: make gql work ${statuses[(index - 1) % statuses.length]}`).should('be.visible')
        }
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
              latestRunUrl="https://cypress.io"
              currentCommitInfo={{ sha: 'new-sha', message: 'a message' }}
            />
          )
        },
      })

      cy.get('[data-cy="commit-new-sha"]').should('exist').contains('Checked out')
      cy.get('[data-cy="open-cloud-latest').should('be.visible').contains('View runs in Cypress Cloud')
    })

    it('displays first commit checked out', () => {
      let firstRunSha: string | null | undefined = null

      cy.mountFragment(RunsContainerFragmentDoc, {
        render (gqlVal) {
          const runs = gqlVal.currentProject?.cloudProject?.__typename === 'CloudProject' ? gqlVal.currentProject.cloudProject.runs?.nodes : undefined

          firstRunSha = runs?.[0].commitInfo?.sha
          const commitInfo = firstRunSha ? { sha: firstRunSha, message: 'a message' } : undefined

          return (
            <RunsLayout
              runs={runs}
              allRunIds={[]}
              isUsingGit={true}
              latestRunUrl="https://cypress.io"
              currentCommitInfo={commitInfo}
            />
          )
        },
      })

      cy.then(() => {
        cy.get(`[data-cy="commit-${firstRunSha}"`).should('exist').contains('Checked out')
      })

      cy.get(`[data-cy="open-cloud-latest"`).should('be.visible').contains('View runs in Cypress Cloud')
    })

    it('displays debug button enabled when allRunIds populated', () => {
      cy.mountFragment(RunsContainerFragmentDoc, {
        render (gqlVal) {
          const runs = gqlVal.currentProject?.cloudProject?.__typename === 'CloudProject' ? gqlVal.currentProject.cloudProject.runs?.nodes : undefined

          const firstRunId = runs?.[0].id
          const secondRunId = runs?.[1].id
          const runIds = firstRunId && secondRunId ? [firstRunId, secondRunId] : undefined

          return (
            <RunsLayout
              runs={runs}
              allRunIds={runIds}
              isUsingGit={true}
              latestRunUrl="https://cypress.io"
              currentCommitInfo={{ sha: 'some-sha', message: 'a message' }}
            />
          )
        },
      })

      cy.get(`[data-cy="open-cloud-latest"`).should('be.visible').contains('View runs in Cypress Cloud')
      cy.get(`[data-cy="runsLayout-git"`).children('li').should('have.length', 21).each((item, index) => {
        if (index === 0) return

        if (index < 3) {
          cy.wrap(item).should('be.visible').contains('Debug').should('be.enabled')
        } else {
          cy.wrap(item).should('be.visible').contains('Debug').should('not.be.enabled')
        }
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
      cy.get(`[data-cy="runsLayout-no-git"`).children('li').should('have.length', 20).each((item, index) => {
        cy.wrap(item).should('be.visible').find(`[data-cy="runCard-status-${statuses[index % statuses.length]}"]`).should('be.visible')
      })
    })
  })
})
