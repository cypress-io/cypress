import SpecRunSummary from './SpecRunSummary.vue'
import { fakeRuns } from '@packages/frontend-shared/cypress/support/mock-graphql/fakeCloudSpecRun'

describe('<SpecRunSummary />', { keystrokeDelay: 0 }, () => {
  it('playground', { viewportHeight: 700, viewportWidth: 500 }, () => {
    const runs = fakeRuns(['PASSED', 'FAILED', 'CANCELLED', 'ERRORED'])

    const now = new Date()
    const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate())
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate())

    runs[1].groupCount = 1
    runs[1].testsFailed.max = null
    runs[1].testsPassed.max = null
    runs[1].testsPending.max = null
    runs[1].specDuration.min = 3760
    runs[1].specDuration.max = null
    runs[1].createdAt = twoYearsAgo.toISOString()

    runs[2].createdAt = twoMonthsAgo.toISOString()
    runs[2].testsFailed.max = runs[2].testsFailed.min

    runs[3].testsFailed.max = 4358
    runs[3].testsPassed.max = 4358
    runs[3].testsPending.max = 4358
    runs[3].testsSkipped.min = 4
    runs[3].testsSkipped.max = 4358
    runs[3].specDuration.min = 3760
    runs[3].specDuration.max = 37600
    runs[3].groupCount = 4358

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
