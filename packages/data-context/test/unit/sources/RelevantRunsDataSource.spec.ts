import { expect } from 'chai'
import sinon from 'sinon'

import { DataContext } from '../../../src'
import { createTestDataContext } from '../helper'
import { RelevantRunsDataSource, RUNS_EMPTY_RETURN } from '../../../src/sources'
import { FAKE_PROJECT_MULTIPLE_COMPLETED, FAKE_PROJECT_MULTIPLE_COMPLETED_PLUS_RUNNING, FAKE_PROJECT_NO_RUNS, FAKE_PROJECT_ONE_RUNNING_RUN, FAKE_SHAS } from './fixtures/graphqlFixtures'

describe('RelevantRunsDataSource', () => {
  let ctx: DataContext
  let dataSource: RelevantRunsDataSource

  beforeEach(() => {
    ctx = createTestDataContext('open')
    dataSource = new RelevantRunsDataSource(ctx)
  })

  it('returns empty with no shas', async () => {
    const result = await dataSource.getRelevantRuns([])

    expect(result).to.equal(RUNS_EMPTY_RETURN)
  })

  it('returns empty with no project set', async () => {
    sinon.stub(ctx.project, 'projectId').resolves(undefined)

    const result = await dataSource.getRelevantRuns([FAKE_SHAS[0]])

    expect(result).to.equal(RUNS_EMPTY_RETURN)
  })

  context('cloud responses', () => {
    beforeEach(() => {
      sinon.stub(ctx.project, 'projectId').resolves('test123')
    })

    type TestDataType = typeof FAKE_PROJECT_MULTIPLE_COMPLETED |
      typeof FAKE_PROJECT_MULTIPLE_COMPLETED_PLUS_RUNNING |
      typeof FAKE_PROJECT_NO_RUNS |
      typeof FAKE_PROJECT_ONE_RUNNING_RUN

    const testScenario = async (testData: TestDataType, expectedResult: { current?: number, next?: number, commitsAhead?: number}) => {
      sinon.stub(ctx.cloud, 'executeRemoteGraphQL').resolves(testData)

      const testShas: string[] = testData.data.cloudProjectBySlug.runsByCommitShas.map((run) => run.commitInfo.sha)

      const result = await dataSource.getRelevantRuns(testShas)

      expect(result).to.eql(expectedResult)
    }

    it('returns empty if cloud project not loaded', async () => {
      await testScenario(FAKE_PROJECT_NO_RUNS, RUNS_EMPTY_RETURN)
    })

    it('returns latest RUNNING build as current if only RUNNING found', async () => {
      await testScenario(FAKE_PROJECT_ONE_RUNNING_RUN, {
        current: 1,
        next: undefined,
        commitsAhead: 0,
      })
    })

    it('returns latest completed build', async () => {
      await testScenario(FAKE_PROJECT_MULTIPLE_COMPLETED, {
        current: 4,
        next: undefined,
        commitsAhead: 0,
      })
    })

    it('returns latest completed and running if both found', async () => {
      await testScenario(FAKE_PROJECT_MULTIPLE_COMPLETED_PLUS_RUNNING, {
        current: 4,
        next: 5,
        commitsAhead: 1,
      })
    })

    it('returns the same current if current already set only one running', async () => {
      sinon.stub(ctx.cloud, 'executeRemoteGraphQL')
      .onFirstCall().resolves(FAKE_PROJECT_ONE_RUNNING_RUN)
      .onSecondCall().resolves(FAKE_PROJECT_ONE_RUNNING_RUN)

      const firstResult = await dataSource.getRelevantRuns([FAKE_SHAS[0]])

      expect(firstResult).to.eql({
        current: 1,
        next: undefined,
        commitsAhead: 0,
      })

      const secondResult = await dataSource.getRelevantRuns([FAKE_SHAS[0]])

      expect(secondResult).to.eql({
        current: 1,
        next: undefined,
        commitsAhead: 0,
      })
    })

    it('returns the same current if current already set and updates after movesToNext is called', async () => {
      sinon.stub(ctx.cloud, 'executeRemoteGraphQL')
      .onFirstCall().resolves(FAKE_PROJECT_ONE_RUNNING_RUN)
      .onSecondCall().resolves(FAKE_PROJECT_MULTIPLE_COMPLETED)
      .onThirdCall().resolves(FAKE_PROJECT_MULTIPLE_COMPLETED)

      const firstResult = await dataSource.getRelevantRuns([FAKE_SHAS[0]])

      expect(firstResult).to.eql({
        current: 1,
        next: undefined,
        commitsAhead: 0,
      })

      const secondResult = await dataSource.getRelevantRuns([FAKE_SHAS[1], FAKE_SHAS[0]])

      expect(secondResult).to.eql({
        current: 1,
        next: 4,
        commitsAhead: 1,
      })

      //TODO refactor to not have to replicate the subscription iterator
      const subscription = ctx.emitter.subscribeTo('relevantRunChange')
      const subValues = []
      const watchSubscription = async () => {
        for await (const value of subscription) {
          //ignore the first undefined value
          if (value) {
            subValues.push(value)
          }
        }
      }

      await dataSource.moveToNext([FAKE_SHAS[1], FAKE_SHAS[0]])

      setImmediate(() => {
        subscription.return(undefined)
      })

      await watchSubscription()

      expect(subValues[0]).to.eql({
        current: 4,
        next: undefined,
        commitsAhead: 0,
      })
    })
  })
})
