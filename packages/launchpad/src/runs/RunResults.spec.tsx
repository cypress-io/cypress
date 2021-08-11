import type { RunGroupTotals } from '@packages/graphql/src'
import RunResults from './RunResults.vue'

const totals: RunGroupTotals = {
  totalPassed: 5,
  totalFailed: 0,
  totalPending: 0,
  totalSkipped: 0,
  totalDuration: 16000,
}

describe('<RunResults />', () => {
  it('playground', () => {
    cy.mount(() => (<RunResults totals={totals} />))
  })
})
