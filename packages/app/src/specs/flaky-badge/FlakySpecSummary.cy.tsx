import FlakySpecSummary from './FlakySpecSummary.vue'

describe('<FlakySpecSummary />', () => {
  it('playground', () => {
    cy.mount(
      <FlakySpecSummary
        specName="test"
        specExtension=".cy.tsx"
        severity="low"
        totalFlakyRuns={4}
        totalRuns={50}
        lastFlaky={15}
        dashboardUrl="#"
      />,
    )

    cy.mount(
      <FlakySpecSummary
        specName="test"
        specExtension=".cy.tsx"
        severity="medium"
        totalFlakyRuns={14}
        totalRuns={50}
        lastFlaky={5}
        dashboardUrl="#"
      />,
    )

    cy.mount(
      <FlakySpecSummary
        specName="test"
        specExtension=".cy.tsx"
        severity="high"
        totalFlakyRuns={24}
        totalRuns={50}
        lastFlaky={2}
        dashboardUrl="#"
      />,
    )
  })

  describe('flaky rate percentages', () => {
    it('should round up to next integer if less than 99%', () => {
      cy.mount(
        <FlakySpecSummary
          specName="test"
          specExtension=".cy.tsx"
          severity="high"
          totalFlakyRuns={888}
          totalRuns={1000}
          lastFlaky={2}
          dashboardUrl="#"
        />,
      )

      cy.findByTestId('flaky-rate').should('have.text', '89% flaky rate')
    })

    it('should round down if between 99 and 100%', () => {
      cy.mount(
        <FlakySpecSummary
          specName="test"
          specExtension=".cy.tsx"
          severity="high"
          totalFlakyRuns={999}
          totalRuns={1000}
          lastFlaky={2}
          dashboardUrl="#"
        />,
      )

      cy.findByTestId('flaky-rate').should('have.text', '99% flaky rate')
    })
  })
})
