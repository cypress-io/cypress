import { defaultMessages } from '@cy/i18n'
import ResultCounts from './ResultCounts.vue'

describe('<ResultCounts />', () => {
  it('renders expected contents', () => {
    cy.mount(() => (
      <ResultCounts
        totalFailed={1}
        totalPassed={2}
        totalPending={3}
        totalSkipped={4}
      />))

    cy.get(`[data-cy="runResults-${defaultMessages.runs.results.skipped}-count"]`)
    .should('contain', '4')

    cy.get(`[data-cy="runResults-${defaultMessages.runs.results.pending}-count"]`)
    .should('contain', '3')

    cy.get(`[data-cy="runResults-${defaultMessages.runs.results.passed}-count"]`)
    .should('contain', '2')

    cy.get(`[data-cy="runResults-${defaultMessages.runs.results.failed}-count"]`)
    .should('contain', '1')

    cy.percySnapshot()
  })
})
