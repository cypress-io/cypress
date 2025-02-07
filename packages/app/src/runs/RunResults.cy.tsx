import RunResults from './RunResults.vue'
import { RunResultsFragmentDoc } from '../generated/graphql-test'
// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these
import { defaultMessages } from '@cy/i18n'
import { CloudRunStubs } from '@packages/graphql/test/stubCloudTypes'

describe('<RunResults />', () => {
  it('shows the failed icon and the number of passed, skipped, pending, failed tests passed through gql props', () => {
    const cloudRuns = Object.values(CloudRunStubs)

    cy.mount(() => cloudRuns.map((cloudRun, i) => (<RunResults data-cy={`run-result-${i}`} gql={cloudRun} />)))

    cloudRuns.forEach((cloudRun, i) => {
      cy.findByTestId(`run-result-${i}`).within(() => {
        cy.get(`[title=${defaultMessages.runs.results.passed}]`).should('contain.text', cloudRun.totalPassed)
        cy.get(`[title=${defaultMessages.runs.results.failed}]`).should('contain.text', cloudRun.totalFailed)
        cy.get(`[title=${defaultMessages.runs.results.skipped}]`).should('contain.text', cloudRun.totalSkipped)
        cy.get(`[title=${defaultMessages.runs.results.pending}]`).should('contain.text', cloudRun.totalPending)
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
    cy.findByTestId('runResults-flakyBadge').contains(defaultMessages.specPage.flaky.badgeLabel)
    cy.findByTestId('total-flaky-tests').contains(4)
  })

  it('responds to breakpoint with ', { viewportWidth: 1279 }, () => {
    mountingFragment(4, false)
    cy.findByTestId('runResults-flakyBadge').contains(defaultMessages.specPage.flaky.badgeLabel).should('be.visible')
    cy.findByTestId('total-flaky-tests').contains(4)

    mountingFragment(4, true)
    cy.findByTestId('runResults-flakyBadge').contains(defaultMessages.specPage.flaky.badgeLabel).should('not.be.visible')
    cy.findByTestId('total-flaky-tests').contains(4)
  })
})
