import DebugPendingRunCounts from './DebugPendingRunCounts.vue'

describe('<DebugPendingRunCounts />', () => {
  it('renders counts for zero total tests', () => {
    cy.mount(
      <DebugPendingRunCounts
        totalSkipped={0}
        totalFailed={0}
        totalPassed={0}
        totalTests={0}
      />,
    )

    cy.contains('0 of 0').should('be.visible')

    cy.percySnapshot()
  })

  it('renders counts for single total test', () => {
    cy.mount(
      <DebugPendingRunCounts
        totalSkipped={0}
        totalFailed={0}
        totalPassed={0}
        totalTests={1}
      />,
    )

    cy.contains('0 of 1').should('be.visible')

    cy.percySnapshot()
  })

  it('renders counts for multiple total test', () => {
    cy.mount(
      <DebugPendingRunCounts
        totalSkipped={1}
        totalFailed={2}
        totalPassed={3}
        totalTests={9}
      />,
    )

    cy.contains('6 of 9').should('be.visible')

    cy.percySnapshot()
  })
})
