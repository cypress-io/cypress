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

  it('renders string range values', () => {
    cy.mount(() => (
      <ResultCounts
        totalFailed="1-2"
        totalPassed="2-20"
        totalPending="5-5"
        totalSkipped="10-1"
      />))

    cy.get(`[data-cy="runResults-${defaultMessages.runs.results.skipped}-count"]`)
    .should('contain', '10-1')

    cy.get(`[data-cy="runResults-${defaultMessages.runs.results.pending}-count"]`)
    .should('contain', '5-5')

    cy.get(`[data-cy="runResults-${defaultMessages.runs.results.passed}-count"]`)
    .should('contain', '2-20')

    cy.get(`[data-cy="runResults-${defaultMessages.runs.results.failed}-count"]`)
    .should('contain', '1-2')

    cy.percySnapshot()
  })

  it('changes order of status signs with the order prop', () => {
    cy.mount(() => (
      <ResultCounts
        data-cy='result-count'
        totalFailed={3}
        totalPassed={4}
        totalPending={5}
        totalSkipped={6}
        order={['SKIPPED', 'FAILED', 'PASSED', 'PENDING']}
      />
    ))

    cy.get('[data-cy=result-count]').children().then((status) => {
      expect(status[0]).to.contain(6)
      expect(status[1]).to.contain(3)
      expect(status[2]).to.contain(4)
      expect(status[3]).to.contain(5)
    })
  })
})
