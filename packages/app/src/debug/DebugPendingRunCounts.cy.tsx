import DebugPendingRunCounts from './DebugPendingRunCounts.vue'

describe('<DebugPendingRunCounts />', () => {
  it('renders counts', () => {
    cy.mount(
      <DebugPendingRunCounts
        specs={{ completedSpecs: 2, totalSpecs: 20 }}
      />,
    )

    cy.contains('2 of 20').should('be.visible')

    cy.percySnapshot()
  })

  it('renders counts of zeros input is undefined', () => {
    cy.mount(
      <DebugPendingRunCounts
        specs={undefined}
      />,
    )

    cy.contains('0 of 0').should('be.visible')

    cy.percySnapshot()
  })

  it('renders count of zero if value in input is null', () => {
    cy.mount(
      <DebugPendingRunCounts
        specs={{ completedSpecs: null, totalSpecs: 1 }}
      />,
    )

    cy.contains('0 of 1').should('be.visible')

    cy.percySnapshot()
  })
})
