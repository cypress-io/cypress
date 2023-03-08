import type { CloudRunStatus } from '../generated/graphql-test'
import DebugRunNumber from './DebugRunNumber.vue'

const STATUSES: CloudRunStatus[] = ['PASSED', 'FAILED', 'CANCELLED', 'RUNNING', 'ERRORED']

describe('<DebugRunNumber />', () => {
  describe('playground', () => {
    STATUSES.forEach((status) => {
      it(`status = '${status}'`, () => {
        cy.mount(<DebugRunNumber status={status} value={123} />)
      })
    })
  })
})
