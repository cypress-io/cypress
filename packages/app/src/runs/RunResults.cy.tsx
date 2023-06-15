import { defaultMessages } from '@cy/i18n'
import { CloudRunStubs } from '@packages/graphql/test/stubCloudTypes'
import { RunCardFragmentDoc } from '../generated/graphql-test'
import RunResults from './RunResults.vue'

describe('<RunResults />', { viewportHeight: 150, viewportWidth: 250 }, () => {
  it('shows number of passed, skipped, pending and failed tests', () => {
    const cloudRuns = Object.values(CloudRunStubs)

    cy.mount(() => cloudRuns.map((cloudRun, i) => (<RunResults data-cy={`run-result-${i}`} gql={cloudRun} />)))

    cloudRuns.forEach((cloudRun, i) => {
      cy.get(`[data-cy=run-result-${i}]`).within(() => {
        cy.get(`[title=${defaultMessages.runs.results.passed}]`).should('contain.text', cloudRun.totalPassed)
        cy.get(`[title=${defaultMessages.runs.results.failed}]`).should('contain.text', cloudRun.totalFailed)
        cy.get(`[title=${defaultMessages.runs.results.skipped}]`).should('contain.text', cloudRun.totalSkipped)
        cy.get(`[title=${defaultMessages.runs.results.pending}]`).should('contain.text', cloudRun.totalPending)
      })
    })
  })

  it('renders flaky ribbon', () => {
    cy.mountFragment(RunCardFragmentDoc, {
      onResult (result) {
        result.totalFlakyTests = 4
      },
      render (gql) {
        return <RunResults gql={gql} />
      },
    })

    cy.contains('4 Flaky')
  })
})
