import DebugPendingRunCounts from './DebugPendingRunCounts.vue'

describe('<DebugPendingRunCounts />', () => {
  it('renders counts for zero total tests', () => {
    cy.mount(
      <DebugPendingRunCounts
        specStatuses={[]}
      />,
    )

    cy.contains('0 of 0').should('be.visible')

    cy.percySnapshot()
  })

  it('renders counts for single total test', () => {
    cy.mount(
      <DebugPendingRunCounts
        specStatuses={['UNCLAIMED']}
      />,
    )

    cy.contains('0 of 1').should('be.visible')

    cy.percySnapshot()
  })

  it('renders counts for multiple total test', () => {
    cy.mount(
      <DebugPendingRunCounts
        specStatuses={['UNCLAIMED', 'NOTESTS', 'FAILED', 'UNCLAIMED', 'PASSED', 'FAILED', 'PASSED', 'ERRORED', 'RUNNING']}
      />,
    )

    cy.contains('6 of 9').should('be.visible')

    cy.percySnapshot()
  })
})
