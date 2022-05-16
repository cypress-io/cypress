import SpecRunSummary from './SpecRunSummary.vue'
import { exampleRuns } from '@packages/frontend-shared/cypress/support/mock-graphql/fakeCloudSpecRun'

describe('<SpecRunSummary />', { keystrokeDelay: 0 }, () => {
  it('playground', { viewportHeight: 800, viewportWidth: 900 }, () => {
    const runs = exampleRuns()

    cy.mount(() => {
      return (
        <div class="flex gap-2">
          <div class="flex flex-col p-4 gap-y-15px">
            <SpecRunSummary run={runs[0]} specFile="bankaccounts.spec.ts"/>

            <SpecRunSummary run={runs[1]} specFile="singleGroup.spec.ts"/>

            <SpecRunSummary run={runs[2]} specFile="noRangeForFailed.spec.ts"/>

            <SpecRunSummary run={runs[3]} specFile="veryVeryVeryVeryVeryVeryVeryVeryVeryLongSpecFileName.spec.ts"/>
          </div>
          <div class="flex flex-col p-4 gap-y-15px">
            <SpecRunSummary run={runs[4]} specFile="bankaccounts.spec.ts"/>

            <SpecRunSummary run={runs[5]} specFile="bankaccounts.spec.ts"/>

            <SpecRunSummary run={runs[6]} specFile="bankaccounts.spec.ts"/>

            <SpecRunSummary run={runs[7]} specFile="bankaccounts.spec.ts"/>
          </div>
        </div>
      )
    })
  })
})
