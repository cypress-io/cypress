import type { CloudRunStatus } from '../generated/graphql-test'
import RunNumber from './RunNumber.vue'

const STATUSES: CloudRunStatus[] = ['PASSED', 'FAILED', 'CANCELLED', 'RUNNING', 'ERRORED']

describe('<RunNumber />', () => {
  describe('playground', () => {
    STATUSES.forEach((status) => {
      it(`status = '${status}'`, () => {
        cy.mount(<RunNumber status={status} value={123} />)
      })
    })
  })
})
