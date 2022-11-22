import DebugResults from './DebugResults.vue'
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
        cy.findByTestId('icon-prefix').should('exist')
      })
    })

    cy.percySnapshot()
  })
})
