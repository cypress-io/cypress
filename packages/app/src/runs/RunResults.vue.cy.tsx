import RunResults from './RunResults.vue'
import { RunResultsFragmentDoc } from '../generated/graphql-test'
import { CloudRunStubs } from '@packages/data-context/test/graphql/stubCloudTypes'

describe('<RunResults />', () => {
  it('shows the failed icon and the number of passed, skipped, pending, failed tests passed through gql props', () => {
    const cloudRuns = Object.values(CloudRunStubs)

    cy.mount(() => cloudRuns.map((cloudRun, i) => (<RunResults data-cy={`run-result-${i}`} gql={cloudRun} />)))

    cloudRuns.forEach((cloudRun, i) => {
      cy.findByTestId(`run-result-${i}`).within(() => {
        cy.get('[title=passed]').should('contain.text', cloudRun.totalPassed)
        cy.get('[title=failed]').should('contain.text', cloudRun.totalFailed)
        cy.get('[title=skipped]').should('contain.text', cloudRun.totalSkipped)
        cy.get('[title=pending]').should('contain.text', cloudRun.totalPending)
      })
    })
  })
})

describe('Flaky badge tests', () => {
  const mountingFragment = (flakyTests: number, useBreakpoint?: boolean) => {
    return (
      cy.mountFragment(RunResultsFragmentDoc, {
        onResult (result) {
          if (result) {
            result.totalFlakyTests = flakyTests
          }
        },
        render: (gqlVal) => {
          return (
            <RunResults gql={gqlVal} useBreakpointDisplay={useBreakpoint} />
          )
        },
      })
    )
  }

  it('does not show flaky component when flakyTests are < 1', () => {
    mountingFragment(0)
    cy.contains('Flaky').should('not.exist')
  })

  it('contains flaky badge', () => {
    mountingFragment(4)
    cy.findByTestId('runResults-flakyBadge').contains('Flaky')
    cy.findByTestId('total-flaky-tests').contains(4)
  })

  it('responds to breakpoint with ', { viewportWidth: 1279 }, () => {
    mountingFragment(4, false)
    cy.findByTestId('runResults-flakyBadge').contains('Flaky').should('be.visible')
    cy.findByTestId('total-flaky-tests').contains(4)

    mountingFragment(4, true)
    cy.findByTestId('runResults-flakyBadge').contains('Flaky').should('not.be.visible')
    cy.findByTestId('total-flaky-tests').contains(4)
  })
})
