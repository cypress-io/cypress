import { DebugPendingRunSplashFragmentDoc } from '../generated/graphql-test'
import DebugPendingRunSplash from './DebugPendingRunSplash.vue'

describe('<DebugPendingRunSplash />', () => {
  it('renders as expected', () => {
    cy.mountFragment(DebugPendingRunSplashFragmentDoc, {
      onResult (result) {
        result.specs = [
          { id: '', status: 'CANCELLED', __typename: 'CloudSpecRun' },
          { id: '', status: 'RUNNING', __typename: 'CloudSpecRun' },
          { id: '', status: 'PASSED', __typename: 'CloudSpecRun' },
          { id: '', status: 'FAILED', __typename: 'CloudSpecRun' },
          { id: '', status: 'UNCLAIMED', __typename: 'CloudSpecRun' },
        ]
      },
      render: (gqlVal) => {
        return (
          <DebugPendingRunSplash
            specStatuses={gqlVal.specs.map((spec) => spec.status!)}
          />
        )
      },
    })

    cy.percySnapshot()
  })
})
