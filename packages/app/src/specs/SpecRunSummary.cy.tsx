import SpecRunSummary from './SpecRunSummary.vue'
import { exampleRuns } from '@packages/frontend-shared/cypress/support/mock-graphql/fakeCloudSpecRun'

describe('<SpecRunSummary />', { keystrokeDelay: 0 }, () => {
  it('playground', { viewportHeight: 700, viewportWidth: 500 }, () => {
    const runs = exampleRuns()

    cy.mount(() => {
      return (
        <div class="flex flex-col p-4 gap-2">
          <SpecRunSummary run={runs[0]} specFile="bankaccounts.spec.ts"/>
          <div class="border border-gray-600"></div>
          <SpecRunSummary run={runs[1]} specFile="singleGroup.spec.ts"/>
          <div class="border border-gray-600"></div>
          <SpecRunSummary run={runs[2]} specFile="noRangeForFailed.spec.ts"/>
          <div class="border border-gray-600"></div>
          <SpecRunSummary run={runs[3]} specFile="veryVeryVeryVeryVeryVeryVeryVeryVeryLongSpecFileName.spec.ts"/>
        </div>
      )
    })
  })
})
