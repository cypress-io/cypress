import DebugRunNavigation from './DebugRunNavigation.vue'
import { DebugRunNavigationFragmentDoc } from '../generated/graphql-test'
import { createRun } from '../../cypress/support/fixtures'

const DebugSpecVariableTypes = {
  runNumber: 'Int',
  commitShas: '[String!]!',
}

function mountDebugDetailedView (data: {
  currentRun: ReturnType<typeof createRun>
  allRuns: Array<ReturnType<typeof createRun>>
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
          <DebugRunNavigation runs={gqlData.allRuns!} currentRunNumber={data.currentRun.runNumber!}/>
        </div>
      )
    },
  })
}

describe('<DebugRunNavigation />', () => {
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
  })

  it('hide toggle if not on latest and only two runs', () => {
    const latest = createRun({ runNumber: 5, status: 'RUNNING', sha: 'sha-123', summary: 'Update code' })
    const other = createRun({ runNumber: 4, status: 'RUNNING', sha: 'sha-123', summary: 'Update code' })

    mountDebugDetailedView({ currentRun: other, allRuns: [latest, other] })

    cy.get('[data-cy="debug-toggle"]').should('not.exist')
  })

  it('latest commit only has one run that is RUNNING - shows previous commit runs as well', () => {
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

    mountDebugDetailedView({ currentRun: other2, allRuns: [latest, other2, other1] })

    // you are NOT on the most recent run
    cy.findByTestId('debug-detailed-header').as('header')
    cy.get('@header').should('not.have.text', 'You are on the most recent run')

    cy.get('[data-cy="debug-toggle"]').click()

    cy.findByTestId('commit-sha-123').should('exist')
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

  describe('Switch to latest run button', () => {
    it('shows "Change to latest run" when current is not latest', () => {
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
