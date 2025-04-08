// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these
import { defaultMessages } from '@cy/i18n'
import ResultCounts from './ResultCounts.vue'

const validateResult = (type: string, value: string | number) => {
  cy.get(`[data-cy="runResults-${type}-count"]`)
  .should('contain', value)
  .get('svg').should('exist')
}

describe('<ResultCounts />', () => {
  it('renders expected contents', () => {
    cy.mount(() => (
      <ResultCounts
        totalFailed={1}
        totalPassed={2}
        totalPending={3}
        totalSkipped={4}
      />))

    validateResult(defaultMessages.runs.results.skipped, 4)
    validateResult(defaultMessages.runs.results.pending, 3)
    validateResult(defaultMessages.runs.results.passed, 2)
    validateResult(defaultMessages.runs.results.failed, 1)
  })

  it('renders zero contents', () => {
    cy.mount(() => (
      <ResultCounts
        totalFailed={0}
        totalPassed={0}
        totalPending={0}
        totalSkipped={0}
      />))

    validateResult(defaultMessages.runs.results.skipped, 0)
    validateResult(defaultMessages.runs.results.pending, 0)
    validateResult(defaultMessages.runs.results.passed, 0)
    validateResult(defaultMessages.runs.results.failed, 0)
  })

  it('renders string range values', () => {
    cy.mount(() => (
      <ResultCounts
        totalFailed="1-2"
        totalPassed="2-20"
        totalPending="5-5"
        totalSkipped="10-1"
      />))

    validateResult(defaultMessages.runs.results.skipped, '10-1')
    validateResult(defaultMessages.runs.results.pending, '5-5')
    validateResult(defaultMessages.runs.results.passed, '2-20')
    validateResult(defaultMessages.runs.results.failed, '1-2')
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
