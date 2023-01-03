import { DebugNewRelevantRunBarFragmentDoc } from '../generated/graphql-test'
import DebugNewRelevantRunBar from './DebugNewRelevantRunBar.vue'
import type { CloudRunStatus } from '../generated/graphql'

describe('<DebugNewRelevantRunBar />', () => {
  [
    { viewportWidth: 300, description: 'small viewport' },
    { viewportWidth: 1028, description: 'large viewport' },
  ].forEach(({ viewportWidth, description }) => {
    context(description, { viewportWidth }, () => {
      ['PASSED', 'FAILED', 'RUNNING'].forEach((status) => {
        it(`handles ${status} status`, () => {
          cy.mountFragment(DebugNewRelevantRunBarFragmentDoc, {
            onResult (result) {
              result.status = status as CloudRunStatus
            },
            render: (gqlVal) => <DebugNewRelevantRunBar gql={gqlVal} />,
          })

          cy.percySnapshot()
        })
      })
    })
  })
})
