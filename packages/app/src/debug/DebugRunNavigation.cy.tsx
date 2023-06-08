import DebugRunNavigation from './DebugRunNavigation.vue'
import { DebugRunNavigationFragment, DebugRunNavigationFragmentDoc } from '../generated/graphql-test'
import { createRun } from '../../cypress/support/fixtures'
import type { CommitInfo } from '@packages/frontend-shared/cypress/support/generated/test-graphql-types.gen'

const DebugSpecVariableTypes = {
  runNumber: 'Int',
  commitShas: '[String!]!',
}

function mountDebugDetailedView (data: {
  currentRun: ReturnType<typeof createRun>
  allRuns: Array<ReturnType<typeof createRun>>
  currentCommitInfo?: CommitInfo
  cloudProjectUrl?: string
}) {
  return cy.mountFragment(DebugRunNavigationFragmentDoc, {
    variableTypes: DebugSpecVariableTypes,
    variables: {
      runNumber: 1,
      commitShas: ['sha-123', 'sha-456'],
    },
    onResult (result) {
      result.allRuns = data.allRuns
    },
    render (gqlData) {
      return (
        <div style="margin: 10px">
          <DebugRunNavigation runs={gqlData.allRuns!} currentRunNumber={data.currentRun.runNumber!} currentCommitInfo={data.currentCommitInfo} cloudProjectUrl={data.cloudProjectUrl} />
        </div>
      )
    },
  }).then(({ component }) => {
    cy.wrap(component.gql).as('gql')
  })
}

describe('<DebugRunNavigation />', () => {
  beforeEach(() => {
    cy.viewport(1200, 850)
  })

  it('only one run should not render', () => {
    const latest = createRun({ runNumber: 1, status: 'RUNNING', sha: 'sha-123', summary: 'Update code', totalInstanceCount: 10, completedInstanceCount: 5 })

    mountDebugDetailedView({ currentRun: latest, allRuns: [latest] })

    cy.findByTestId('debug-detailed-header').should('not.exist')
  })

  it('latest run sha is same as current run sha', () => {
    const latest = createRun({ runNumber: 5, status: 'RUNNING', sha: 'sha-123', summary: 'Update code' })
    const other = createRun({ runNumber: 4, status: 'RUNNING', sha: 'sha-123', summary: 'Update code' })

    mountDebugDetailedView({ currentRun: latest, allRuns: [latest, other] })

    cy.get('[data-cy="debug-toggle"]').click()

    cy.findByTestId('current-run').should('exist')
    cy.contains('We found more than 100 runs.').should('not.exist')
  })

  it('hide toggle if not on latest and only two runs', () => {
    const latest = createRun({ runNumber: 5, status: 'RUNNING', sha: 'sha-123', summary: 'Update code' })
    const other = createRun({ runNumber: 4, status: 'RUNNING', sha: 'sha-123', summary: 'Update code' })

    mountDebugDetailedView({ currentRun: other, allRuns: [latest, other] })

    cy.get('[data-cy="debug-toggle"]').should('not.exist')
  })

  it('should correctly update when switching from running to completed', () => {
    const start = new Date()

    cy.clock(start)
    const allRuns = [
      createRun({ runNumber: 5, status: 'RUNNING', sha: 'sha-123', summary: 'Update code', createdAt: start.toISOString() }),
      createRun({ runNumber: 4, status: 'FAILED', sha: 'sha-123', summary: 'Update code' }),
      createRun({ runNumber: 3, status: 'FAILED', sha: 'sha-123', summary: 'Update code' }),
      createRun({ runNumber: 2, status: 'PASSED', sha: 'sha-123', summary: 'Update code' }),
    ]

    mountDebugDetailedView({ currentRun: allRuns[1], allRuns })

    cy.get<DebugRunNavigationFragment>('@gql').then((gql) => {
      cy.wrap(gql.allRuns).as('runs')
    })

    cy.get('[data-cy="debug-toggle"]').click()

    cy.tick(2 * 1000) //allow toggle to animate

    cy.findByTestId('run-5').as('run5').should('be.visible').within(() => {
      cy.contains('00m 02s')
      cy.tick(60 * 1000)
      cy.contains('01m 02s')
    })

    cy.get<DebugRunNavigationFragment['allRuns']>('@runs').then((runs) => {
      const firstRun = runs?.[0]

      if (firstRun) {
        firstRun.status = 'PASSED'
        firstRun.totalDuration = 6000
      }
    })

    //should show the totalDuration after it stops running
    cy.get('@run5').contains('00m 06s')

    cy.tick(10 * 1000)

    //should continue to show the totalDuration after it stops running
    cy.get('@run5').contains('00m 06s')
  })

  context('several runs', () => {
    beforeEach(() => {
      const latest = createRun({
        runNumber: 3,
        status: 'RUNNING',
        sha: 'sha-123',
        summary: 'add new feature with a really long commit message to see what happens',
        completedInstanceCount: 5,
        totalInstanceCount: 12,
      })

      const other1 = createRun({ runNumber: 1, status: 'PASSED', sha: 'sha-456', summary: 'Update code' })
      const other2 = createRun({ runNumber: 2, status: 'PASSED', sha: 'sha-456', summary: 'Update code' })

      const commitInfo = { sha: 'sha-123', message: 'add new feature with a really long commit message to see what happens' } as CommitInfo

      mountDebugDetailedView({ currentRun: other2, allRuns: [latest, other2, other1], currentCommitInfo: commitInfo })
    })

    it('latest commit only has one run that is RUNNING - shows previous commit runs as well', () => {
      // you are NOT on the most recent run
      cy.findByTestId('debug-detailed-header').as('header')
      cy.get('@header').should('not.have.text', 'You are on the most recent run')

      cy.get('[data-cy="debug-toggle"]').click()

      cy.contains('We found more than 100 runs.').should('not.exist')

      cy.findByTestId('commit-sha-123').as('commit-123').should('exist')
      cy.get('@commit-123').contains('sha-123')
      cy.get('@commit-123').contains('add new feature with a really long commit message to see what happens')
      cy.get('@commit-123').within(() => {
        cy.findByTestId('tag-checked-out').should('be.visible')
      })

      cy.findByTestId('commit-sha-456').should('exist')

      cy.findByTestId('current-run').as('current').contains('#2')
      cy.get('@current').findByTestId('current-run-check')

      cy.findByTestId('run-3').as('run-3').contains('#3')
      cy.get('@run-3').contains('5 of 12 specs completed')
      cy.findByTestId('run-3').as('run-3').contains('#3')
      cy.get('@run-3').contains('12 specs')

      cy.findByTestId('run-2').as('run-2').contains('#2')
      cy.get('@run-2').contains('10 specs')

      cy.findByTestId('run-1').as('run-1').contains('#1')
      cy.get('@run-1').contains('10 specs')
    })

    it('renders correctly in several sizes', () => {
      //pausing time to prevent Percy flake
      cy.clock(new Date())
      cy.get('[data-cy="debug-toggle"]').click()
      cy.tick(2 * 1000) //allow toggle to animate

      cy.contains('We found more than 100 runs.').should('not.exist')

      cy.viewport(616, 850) //currently the narrowest the parent component will go
      cy.percySnapshot('narrowest')
      cy.viewport(650, 850)
      cy.percySnapshot('narrow')
      cy.viewport(800, 850)
      cy.percySnapshot('medium')
      cy.viewport(1200, 850)
      cy.percySnapshot('wide')
      cy.viewport(2000, 850)
      cy.percySnapshot('widest')
    })
  })

  it('shows extra commit line for current commit if it does not have a run', () => {
    const latest = createRun({
      runNumber: 3,
      status: 'RUNNING',
      sha: 'sha-123',
      summary: 'add new feature',
      completedInstanceCount: 5,
      totalInstanceCount: 12,
    })

    const other1 = createRun({ runNumber: 1, status: 'PASSED', sha: 'sha-456', summary: 'Update code' })
    const other2 = createRun({ runNumber: 2, status: 'PASSED', sha: 'sha-456', summary: 'Update code' })

    const commitInfo = { sha: 'sha-other', message: 'my latest commit' } as CommitInfo

    mountDebugDetailedView({ currentRun: other2, allRuns: [latest, other2, other1], currentCommitInfo: commitInfo })

    cy.get('[data-cy="debug-toggle"]').click()

    cy.findByTestId('commit-sha-other').within(() => {
      cy.findByTestId('tag-checked-out').should('be.visible')
    })
  })

  it('displays the limit message when the number of total runs is exactly 100', () => {
    const latest = createRun({
      runNumber: 99,
      status: 'RUNNING',
      sha: 'sha-123',
      summary: 'add new feature with a really long commit message to see what happens',
      completedInstanceCount: 5,
      totalInstanceCount: 12,
    })

    const other1 = createRun({ runNumber: 98, status: 'PASSED', sha: 'sha-456', summary: 'Update code' })
    const other2 = createRun({ runNumber: 97, status: 'PASSED', sha: 'sha-456', summary: 'Update code' })

    const allRuns = [other1, other2]

    for (let i = 96; i >= 0; i--) {
      allRuns.push(createRun({ runNumber: i, status: 'PASSED', sha: 'sha-456', summary: 'Update code' }))
    }

    const commitInfo = { sha: 'sha-123', message: 'add new feature with a really long commit message to see what happens' } as CommitInfo

    mountDebugDetailedView({ currentRun: other1, allRuns: [latest, ...allRuns], currentCommitInfo: commitInfo, cloudProjectUrl: 'https://cloud.cypress.io/projects/ypt4pf/' })

    // This should only show when the list is expanded
    cy.contains('We found more than 100 runs.').should('not.exist')

    cy.findByTestId('debug-toggle').click()

    cy.contains('We found more than 100 runs.').should('be.visible')
    cy.findByRole('link', { name: 'Go to Cypress Cloud to see all runs' }).should('be.visible').should('have.attr', 'href', 'https://cloud.cypress.io/projects/ypt4pf/?utm_medium=Debug+Tab&utm_campaign=Run+Navigation+Limit&utm_source=Binary%3A+Launchpad')
  })

  describe('Switch to latest run button', () => {
    it('shows "Switch to latest run" when current is not latest', () => {
      const latest = createRun({ runNumber: 3, status: 'PASSED', sha: 'sha-123', summary: 'Update code #2' })
      const current = createRun({ runNumber: 2, status: 'PASSED', sha: 'sha-456', summary: 'Update code #1' })

      mountDebugDetailedView({ allRuns: [latest, current], currentRun: current })

      cy.findByTestId('switch-to-latest').should('exist')
    })

    it('does not show "Change to latest run" when current is latest', () => {
      const latest = createRun({ runNumber: 3, status: 'PASSED', sha: 'sha-123', summary: 'Update code #2' })
      const current = createRun({ runNumber: 2, status: 'PASSED', sha: 'sha-456', summary: 'Update code #1' })

      mountDebugDetailedView({ allRuns: [latest, current], currentRun: latest })

      cy.findByTestId('switch-to-latest').should('not.exist')
    })
  })

  it('toggles content', () => {
    const latest = createRun({ runNumber: 3, status: 'PASSED', sha: 'sha-123', summary: 'Update code #2' })
    const current = createRun({ runNumber: 2, status: 'PASSED', sha: 'sha-456', summary: 'Update code #1' })

    mountDebugDetailedView({ allRuns: [latest, current], currentRun: latest })

    cy.findByTestId('debug-historical-runs').should('not.exist')
    cy.findByTestId('debug-toggle').click()
    cy.findByTestId('debug-historical-runs').should('exist')
  })
})
