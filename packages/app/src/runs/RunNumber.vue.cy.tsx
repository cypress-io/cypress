import type { CloudRunStatus } from '../generated/graphql-test'
import RunNumber from './RunNumber.vue'

const STATUSES: CloudRunStatus[] = ['PASSED', 'FAILED', 'CANCELLED', 'RUNNING', 'ERRORED']

describe('<RunNumber />', () => {
  describe('playground', () => {
    STATUSES.forEach((status) => {
      it(`status = '${status}'`, () => {
        cy.mount(() => (
          <div class="flex m-2">
            <RunNumber status={status} value={123} />
          </div>
        ))

        cy.findByTestId(`runNumber-status-${status}`).should('be.visible').should('not.have.class', 'group-focus-visible:outline')
      })
    })
  })

  describe('with hover', () => {
    STATUSES.forEach((status) => {
      it(`status = '${status}'`, () => {
        cy.mount(() => (
          <div class="flex m-2 group">
            <RunNumber status={status} value={123} is-actionable={true} />
          </div>
        ))

        cy.findByTestId(`runNumber-status-${status}`).should('be.visible').should('have.class', 'group-focus-visible:outline')
      })
    })
  })
})
