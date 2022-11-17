import DebugResults from './DebugResults.vue'
import { defaultMessages } from '@cy/i18n'
import { CloudRunStubs } from '@packages/graphql/test/stubCloudTypes'

describe('<DebugResults />', () => {
  it('mounts with default values', () => {
    cy.mount(<DebugResults/>)
    cy.get('[data-cy=debug-results-holder]').then((items) => {
      cy.get(`[title=${defaultMessages.runs.results.passed}]`).should('contain.text', 1)
      cy.get(`[title=${defaultMessages.runs.results.failed}]`).should('contain.text', 7)
      cy.get(`[title=${defaultMessages.runs.results.skipped}]`).should('contain.text', 6)
      cy.get(`[title=${defaultMessages.runs.results.pending}]`).should('contain.text', 6)
    })
  })

  it('shows the failed icon and the number of passed, skipped, pending, failed tests passed through gql props', () => {
    const cloudRuns = Object.values(CloudRunStubs)

    cy.mount(() => cloudRuns.map((cloudRun, i) => (<DebugResults data-cy={`run-result-${i}`} gql={cloudRun} />)))

    cloudRuns.forEach((cloudRun, i) => {
      cy.get(`[data-cy=run-result-${i}]`).within(() => {
        cy.get(`[title=${defaultMessages.runs.results.passed}]`).should('contain.text', cloudRun.totalPassed)
        cy.get(`[title=${defaultMessages.runs.results.failed}]`).should('contain.text', cloudRun.totalFailed)
        cy.get(`[title=${defaultMessages.runs.results.skipped}]`).should('contain.text', cloudRun.totalSkipped)
        cy.get(`[title=${defaultMessages.runs.results.pending}]`).should('contain.text', cloudRun.totalPending)
        cy.get('[data-cy=failed-prefix]').should('exist')
      })
    })

    cy.percySnapshot()
  })
})
