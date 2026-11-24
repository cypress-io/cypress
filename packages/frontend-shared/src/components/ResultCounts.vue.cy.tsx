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

    validateResult('skipped', 4)
    validateResult('pending', 3)
    validateResult('passed', 2)
    validateResult('failed', 1)
  })

  it('renders zero contents', () => {
    cy.mount(() => (
      <ResultCounts
        totalFailed={0}
        totalPassed={0}
        totalPending={0}
        totalSkipped={0}
      />))

    validateResult('skipped', 0)
    validateResult('pending', 0)
    validateResult('passed', 0)
    validateResult('failed', 0)
  })

  it('renders string range values', () => {
    cy.mount(() => (
      <ResultCounts
        totalFailed="1-2"
        totalPassed="2-20"
        totalPending="5-5"
        totalSkipped="10-1"
      />))

    validateResult('skipped', '10-1')
    validateResult('pending', '5-5')
    validateResult('passed', '2-20')
    validateResult('failed', '1-2')
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
