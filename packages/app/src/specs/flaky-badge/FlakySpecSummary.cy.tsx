import FlakySpecSummary from './FlakySpecSummary.vue'

describe('<FlakySpecSummary />', () => {
  it('severities', () => {
    cy.mount(() =>
      <div>
        <FlakySpecSummary
          specName="test"
          specExtension=".cy.tsx"
          severity="low"
          totalFlakyRuns={4}
          totalRuns={50}
          runsSinceLastFlake={15}
        />
        <FlakySpecSummary
          specName="test"
          specExtension=".cy.tsx"
          severity="medium"
          totalFlakyRuns={14}
          totalRuns={50}
          runsSinceLastFlake={5}
        />
        <FlakySpecSummary
          specName="test"
          specExtension=".cy.tsx"
          severity="high"
          totalFlakyRuns={24}
          totalRuns={50}
          runsSinceLastFlake={2}
        />
        <FlakySpecSummary
          specName="test"
          specExtension=".cy.tsx"
          severity={'unknown_value'}
          // @ts-ignore
          totalFlakyRuns={null}
          // @ts-ignore
          totalRuns={null}
          // @ts-ignore
          runsSinceLastFlake={null}
        />,
      </div>)

    cy.findByTestId('flaky-specsummary-loading-1').should('be.visible')
    cy.percySnapshot()
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
          runsSinceLastFlake={2}
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
          runsSinceLastFlake={2}
        />,
      )

      cy.findByTestId('flaky-rate').should('have.text', '99% flaky rate')
    })
  })

  describe('pluralization', () => {
    it('should handle zero flaky runs and zero runs since last flake', () => {
      cy.mount(
        <FlakySpecSummary
          specName="test"
          specExtension=".cy.tsx"
          severity="high"
          totalFlakyRuns={0}
          totalRuns={1000}
          runsSinceLastFlake={0}
        />,
      )

      cy.findByTestId('flaky-runs').should('have.text', '0 flaky runs / 1000 total')
      cy.findByTestId('last-flaky').should('have.text', 'Last run flaky')
    })

    it('should handle 1 flaky run and 1 run since last flake', () => {
      cy.mount(
        <FlakySpecSummary
          specName="test"
          specExtension=".cy.tsx"
          severity="high"
          totalFlakyRuns={1}
          totalRuns={1000}
          runsSinceLastFlake={1}
        />,
      )

      cy.findByTestId('flaky-runs').should('have.text', '1 flaky run / 1000 total')
      cy.findByTestId('last-flaky').should('have.text', 'Last flaky 1 run ago')
    })

    it('should handle multiple flaky runs and multiple runs since last flake', () => {
      cy.mount(
        <FlakySpecSummary
          specName="test"
          specExtension=".cy.tsx"
          severity="high"
          totalFlakyRuns={2}
          totalRuns={1000}
          runsSinceLastFlake={2}
        />,
      )

      cy.findByTestId('flaky-runs').should('have.text', '2 flaky runs / 1000 total')
      cy.findByTestId('last-flaky').should('have.text', 'Last flaky 2 runs ago')
    })
  })
})
