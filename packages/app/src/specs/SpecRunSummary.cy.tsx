import SpecRunSummary from './SpecRunSummary.vue'
import { exampleRuns } from '@packages/frontend-shared/cypress/support/mock-graphql/fakeCloudSpecRun'

describe('<SpecRunSummary />', { keystrokeDelay: 0 }, () => {
  it('playground', { viewportHeight: 800, viewportWidth: 720 }, () => {
    const runs = exampleRuns()

    cy.mount(() => {
      return (
        <div class="flex gap-2">
          <div class="flex flex-col bg-light-900 p-5 gap-y-15px children:bg-white">
            <SpecRunSummary run={runs[0]} specFileNoExtension="bankaccounts" specFileExtension=".spec.ts"/>

            <SpecRunSummary run={runs[1]} specFileNoExtension="singleGroup" specFileExtension=".spec.ts"/>

            <SpecRunSummary run={runs[2]} specFileNoExtension="noRangeForFailed" specFileExtension=".spec.ts"/>

            <SpecRunSummary run={runs[3]} specFileNoExtension="veryVeryVeryVeryVeryVeryVeryVeryVeryLongSpecFileName" specFileExtension=".spec.ts"/>
          </div>
          <div class="flex flex-col bg-light-900 p-5 gap-y-15px children:bg-white">
            <SpecRunSummary run={runs[4]} specFileNoExtension="bankaccounts" specFileExtension=".spec.ts"/>

            <SpecRunSummary run={runs[5]} specFileNoExtension="bankaccounts" specFileExtension=".spec.ts"/>

            <SpecRunSummary run={runs[6]} specFileNoExtension="bankaccounts" specFileExtension=".spec.ts"/>

            <SpecRunSummary run={runs[7]} specFileNoExtension="veryVeryVeryVeryVeryVeryVeryVeryVeryLongSpecFileName" specFileExtension=".spec.ts"/>
          </div>
        </div>
      )
    })
  })
})
