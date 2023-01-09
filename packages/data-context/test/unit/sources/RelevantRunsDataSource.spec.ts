import { expect } from 'chai'
import sinon from 'sinon'

import { DataContext } from '../../../src'
import { createTestDataContext } from '../helper'
import { RelevantRunsDataSource, EMPTY_RETURN } from '../../../src/sources'
import { FAKE_PROJECT_MULTIPLE_COMPLETED, FAKE_PROJECT_MULTIPLE_COMPLETED_PLUS_RUNNING, FAKE_PROJECT_NO_RUNS, FAKE_PROJECT_ONE_RUNNING_RUN } from './fixtures/graphqlFixtures'

const TEST_SHA = 'fcb90fc753a2111d1eb32d207e801e6b2985a231'

describe('RelevantRunsDataSource', () => {
  let ctx: DataContext
  let dataSource: RelevantRunsDataSource

  beforeEach(() => {
    ctx = createTestDataContext('open')
    dataSource = new RelevantRunsDataSource(ctx)
  })

  it('returns empty with no shas', async () => {
    const result = await dataSource.getRelevantRuns([])

    expect(result).to.equal(EMPTY_RETURN)
  })

  it('returns empty with no project set', async () => {
    sinon.stub(ctx.project, 'projectId').resolves(undefined)

    const result = await dataSource.getRelevantRuns([TEST_SHA])

    expect(result).to.equal(EMPTY_RETURN)
  })

  context('cloud responses', () => {
    beforeEach(() => {
      sinon.stub(ctx.project, 'projectId').resolves('test123')
    })

    const testScenario = async (testData, expectedResult) => {
      sinon.stub(ctx.cloud, 'executeRemoteGraphQL').resolves(testData)

      const result = await dataSource.getRelevantRuns([TEST_SHA])

      expect(result).to.eql(expectedResult)
    }

    //TODO: Skipping to figure out how to mock cloud query
    it('returns empty if cloud project not loaded', async () => {
      await testScenario(FAKE_PROJECT_NO_RUNS, EMPTY_RETURN)
    })

    it('returns latest RUNNING build as current if only RUNNING found', async () => {
      await testScenario(FAKE_PROJECT_ONE_RUNNING_RUN, {
        current: 1,
        next: undefined,
      })
    })

    it('returns latest completed build', async () => {
      await testScenario(FAKE_PROJECT_MULTIPLE_COMPLETED, {
        current: 4,
        next: undefined,
      })
    })

    it('returns latest completed and running if both found', async () => {
      await testScenario(FAKE_PROJECT_MULTIPLE_COMPLETED_PLUS_RUNNING, {
        current: 4,
        next: 5,
      })
    })

    it('returns the same current if current already set and moves to next', async () => {
      sinon.stub(ctx.cloud, 'executeRemoteGraphQL')
      .onFirstCall().resolves(FAKE_PROJECT_ONE_RUNNING_RUN)
      .onSecondCall().resolves(FAKE_PROJECT_MULTIPLE_COMPLETED)
      .onThirdCall().resolves(FAKE_PROJECT_MULTIPLE_COMPLETED)

      const firstResult = await dataSource.getRelevantRuns([TEST_SHA])

      expect(firstResult).to.eql({
        current: 1,
        next: undefined,
      })

      const secondResult = await dataSource.getRelevantRuns([TEST_SHA])

      expect(secondResult).to.eql({
        current: 1,
        next: 4,
      })

      const thirdResult = await dataSource.moveToNext([TEST_SHA])

      expect(thirdResult).to.eql({
        current: 4,
        next: undefined,
      })
    })
  })
})
