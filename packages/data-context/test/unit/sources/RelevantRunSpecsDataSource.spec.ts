import { expect } from 'chai'
import sinon from 'sinon'

import { DataContext } from '../../../src'
import { createTestDataContext } from '../helper'
import { RelevantRunSpecsDataSource, SPECS_EMPTY_RETURN } from '../../../src/sources'
import { FAKE_PROJECT_ONE_RUNNING_RUN_ONE_COMPLETED_TWO_SPECS, FAKE_PROJECT_ONE_RUNNING_RUN_ONE_SPEC } from './fixtures/graphqlFixtures'

describe('RelevantRunsDataSource', () => {
  let ctx: DataContext
  let dataSource: RelevantRunSpecsDataSource

  beforeEach(() => {
    ctx = createTestDataContext('open')
    dataSource = new RelevantRunSpecsDataSource(ctx)
  })

  describe('specs', () => {
    it('returns empty when no specs found', async () => {
      const specs = dataSource.specs

      expect(specs).to.eql({})
    })

    it('returns specs when specs are found', () => {
      // TODO
    })
  })

  describe('getRelevantRunSpecs()', async () => {
    beforeEach(() => {
      sinon.stub(ctx.project, 'projectId').resolves('test123')
    })

    it('returns no specs or statuses when no specs found for run', async () => {
      const result = await dataSource.getRelevantRunSpecs({ current: 11111, next: 22222, commitsAhead: 0 })

      expect(result).to.eql(SPECS_EMPTY_RETURN)
    })

    it('returns expected specs and statuses when one run is found', async () => {
      sinon.stub(ctx.cloud, 'executeRemoteGraphQL').resolves(FAKE_PROJECT_ONE_RUNNING_RUN_ONE_SPEC)

      const result = await dataSource.getRelevantRunSpecs({ current: 1, next: null, commitsAhead: 0 })

      expect(result).to.eql({
        runSpecs: { current: {
          completedSpecs: 1,
          runNumber: 1,
          totalSpecs: 1,
        } },
        statuses: { current: 'RUNNING' },
      })
    })

    it('returns expected specs and statuses when one run is completed and one is running', async () => {
      sinon.stub(ctx.cloud, 'executeRemoteGraphQL').resolves(FAKE_PROJECT_ONE_RUNNING_RUN_ONE_COMPLETED_TWO_SPECS)

      const result = await dataSource.getRelevantRunSpecs({ current: 1, next: null, commitsAhead: 0 })

      expect(result).to.eql({
        runSpecs: { current: {
          completedSpecs: 2,
          runNumber: 1,
          totalSpecs: 2,
        },
        next: {
          completedSpecs: 0,
          runNumber: 2,
          totalSpecs: 3,
        },
        },
        statuses: {
          current: 'PASSED',
          next: 'RUNNING',
        },
      })
    })
  })
})
