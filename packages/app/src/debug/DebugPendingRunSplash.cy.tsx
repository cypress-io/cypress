import { DebugPendingRunSplashFragmentDoc } from '../generated/graphql-test'
import DebugPendingRunSplash from './DebugPendingRunSplash.vue'

describe('<DebugPendingRunSplash />', () => {
  it('renders as expected', () => {
    cy.mountFragment(DebugPendingRunSplashFragmentDoc, {
      onResult (result) {
        result.totalTests = 999
      },
      render: (gqlVal) => {
        return (
          <DebugPendingRunSplash
            totalTests={gqlVal.totalTests!}
            totalSkipped={gqlVal.totalSkipped!}
            totalFailed={gqlVal.totalFailed!}
            totalPassed={gqlVal.totalPassed!}
          />
        )
      },
    })

    cy.percySnapshot()
  })
})
