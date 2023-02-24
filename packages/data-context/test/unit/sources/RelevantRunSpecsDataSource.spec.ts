import { expect } from 'chai'
import sinon from 'sinon'

import { DataContext } from '../../../src'
import { createTestDataContext } from '../helper'
import { RelevantRunSpecsDataSource, SPECS_EMPTY_RETURN } from '../../../src/sources'
import { FAKE_PROJECT_ONE_RUNNING_RUN_ONE_COMPLETED_THREE_SPECS, FAKE_PROJECT_ONE_RUNNING_RUN_ONE_SPEC } from './fixtures/graphqlFixtures'

describe('RelevantRunSpecsDataSource', () => {
  let ctx: DataContext
  let dataSource: RelevantRunSpecsDataSource

  beforeEach(() => {
    ctx = createTestDataContext('open')
    dataSource = new RelevantRunSpecsDataSource(ctx)
    sinon.stub(ctx.project, 'projectId').resolves('test123')
  })

  describe('getRelevantRunSpecs()', () => {
    it('returns no specs or statuses when no specs found for run', async () => {
      const result = await dataSource.getRelevantRunSpecs({ current: 11111, next: 22222, commitsAhead: 0 })

      expect(result).to.eql(SPECS_EMPTY_RETURN)
    })

    it('returns expected specs and statuses when one run is found', async () => {
      sinon.stub(ctx.cloud, 'executeRemoteGraphQL').resolves(FAKE_PROJECT_ONE_RUNNING_RUN_ONE_SPEC)

      const result = await dataSource.getRelevantRunSpecs({ current: 1, next: null, commitsAhead: 0 })

      expect(result).to.eql({
        runSpecs: {
          current: {
            runNumber: 1,
            completedSpecs: 1,
            totalSpecs: 1,
          },
        },
        statuses: { current: 'RUNNING' },
        testCounts: { current: 5 },
      })
    })

    it('returns expected specs and statuses when one run is completed and one is running', async () => {
      sinon.stub(ctx.cloud, 'executeRemoteGraphQL').resolves(FAKE_PROJECT_ONE_RUNNING_RUN_ONE_COMPLETED_THREE_SPECS)

      const result = await dataSource.getRelevantRunSpecs({ current: 1, next: null, commitsAhead: 0 })

      expect(result).to.eql({
        runSpecs: {
          current: {
            runNumber: 1,
            completedSpecs: 3,
            totalSpecs: 3,
          },
          next: {
            runNumber: 2,
            completedSpecs: 0,
            totalSpecs: 3,
          },
        },
        statuses: {
          current: 'PASSED',
          next: 'RUNNING',
        },
        testCounts: { current: 7, next: 0 },
      })
    })
  })
})
