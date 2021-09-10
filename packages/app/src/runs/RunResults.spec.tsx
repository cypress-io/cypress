import type { RunGroupTotals } from '@packages/graphql/src/entities/run/Run'
import RunResults from './RunResults.vue'

const totals: RunGroupTotals = {
  totalDuration: 1000,
  totalPassed: 5,
  totalFailed: 0,
  totalSkipped: 0,
  totalPending: 4,
}

describe('<RunResults />', () => {
  it('playground', () => {
    cy.mount(() => <RunResults totals={totals} />)
  })
})
