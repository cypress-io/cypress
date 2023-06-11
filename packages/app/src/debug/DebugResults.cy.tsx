import DebugResults from './DebugResults.vue'
import { DebugResultsFragmentDoc } from '../generated/graphql-test'
import { defaultMessages } from '@cy/i18n'
import { CloudRunStubs } from '@packages/graphql/test/stubCloudTypes'

describe('<DebugResults />', () => {
  it('shows the failed icon and the number of passed, skipped, pending, failed tests passed through gql props', () => {
    const cloudRuns = Object.values(CloudRunStubs)

    cy.mount(() => cloudRuns.map((cloudRun, i) => (<DebugResults data-cy={`run-result-${i}`} gql={cloudRun} />)))

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
  const mountingFragment = (flakyTests: number) => {
    return (
      cy.mountFragment(DebugResultsFragmentDoc, {
        onResult (result) {
          if (result) {
            result.totalFlakyTests = flakyTests
          }
        },
        render: (gqlVal) => {
          return (
            <DebugResults gql={gqlVal} />
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
    cy.findByTestId('debug-flaky-badge').contains(defaultMessages.specPage.flaky.badgeLabel)
    cy.findByTestId('total-flaky-tests').contains(4)
  })
})
