import { expect } from 'chai'
import sinon from 'sinon'

import { DataContext } from '../../../src'
import { createTestDataContext } from '../helper'
import { RelevantRunsDataSource, RUNS_EMPTY_RETURN } from '../../../src/sources'
import { FAKE_PROJECT_MULTIPLE_COMPLETED, FAKE_PROJECT_MULTIPLE_COMPLETED_PLUS_RUNNING, FAKE_PROJECT_NO_RUNS, FAKE_PROJECT_ONE_RUNNING_RUN, FAKE_SHAS } from './fixtures/graphqlFixtures'
import { RelevantRun } from '../../../src/gen/graphcache-config.gen'

const _PROJECTS = [FAKE_PROJECT_MULTIPLE_COMPLETED, FAKE_PROJECT_MULTIPLE_COMPLETED_PLUS_RUNNING, FAKE_PROJECT_NO_RUNS, FAKE_PROJECT_ONE_RUNNING_RUN] as const

type TestProject = typeof _PROJECTS[number]

function latestRunSha (project: TestProject) {
  return project.data.cloudProjectBySlug.runsByCommitShas?.[0].commitInfo.sha
}

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

    const getShasForTestData = (testData: TestDataType) => {
      return testData.data.cloudProjectBySlug.runsByCommitShas.map((run) => run.commitInfo.sha)
    }

    const testScenario = async (testData: TestDataType, expectedResult: RelevantRun) => {
      sinon.stub(ctx.cloud, 'executeRemoteGraphQL').resolves(testData)

      const testShas: string[] = getShasForTestData(testData)

      const result = await dataSource.getRelevantRuns(testShas)

      expect(result).to.eql(expectedResult)
    }

    it('returns empty if cloud project not loaded', async () => {
      await testScenario(FAKE_PROJECT_NO_RUNS, RUNS_EMPTY_RETURN)
    })

    it('returns latest RUNNING build as current if only RUNNING found', async () => {
      await testScenario(FAKE_PROJECT_ONE_RUNNING_RUN, {
        current: 1,
        all: [latestRunSha(FAKE_PROJECT_ONE_RUNNING_RUN)],
        commitsAhead: 0,
      })
    })

    it('returns latest completed build', async () => {
      await testScenario(FAKE_PROJECT_MULTIPLE_COMPLETED, {
        current: 4,
        all: [latestRunSha(FAKE_PROJECT_MULTIPLE_COMPLETED)],
        commitsAhead: 0,
      })
    })

    it('returns latest completed and running if both found', async () => {
      await testScenario(FAKE_PROJECT_MULTIPLE_COMPLETED_PLUS_RUNNING, {
        current: 5,
        all: [
          FAKE_PROJECT_MULTIPLE_COMPLETED_PLUS_RUNNING.data.cloudProjectBySlug.runsByCommitShas[0].commitInfo.sha,
          FAKE_PROJECT_MULTIPLE_COMPLETED_PLUS_RUNNING.data.cloudProjectBySlug.runsByCommitShas[1].commitInfo.sha,
        ],
        commitsAhead: 0,
      })
    })

    it('returns the same current if current already set only one running', async () => {
      sinon.stub(ctx.cloud, 'executeRemoteGraphQL')
      .onFirstCall().resolves(FAKE_PROJECT_ONE_RUNNING_RUN)
      .onSecondCall().resolves(FAKE_PROJECT_ONE_RUNNING_RUN)

      const firstResult = await dataSource.getRelevantRuns([FAKE_SHAS[0]])

      expect(firstResult, 'running should be current after first check').to.eql({
        all: [FAKE_PROJECT_ONE_RUNNING_RUN.data.cloudProjectBySlug.runsByCommitShas[0].commitInfo.sha],
        current: 1,
        commitsAhead: 0,
      })

      const secondResult = await dataSource.getRelevantRuns([FAKE_SHAS[0]])

      expect(secondResult, 'running should be current after second check').to.eql({
        all: [FAKE_PROJECT_ONE_RUNNING_RUN.data.cloudProjectBySlug.runsByCommitShas[0].commitInfo.sha],
        current: 1,
        commitsAhead: 0,
      })
    })

    // TODO: Verify if this still is correct behavior
    it.skip('returns the same current if current already set and updates after movesToNext is called', async () => {
      sinon.stub(ctx.cloud, 'executeRemoteGraphQL')
      .onFirstCall().resolves(FAKE_PROJECT_ONE_RUNNING_RUN)
      .onSecondCall().resolves(FAKE_PROJECT_MULTIPLE_COMPLETED)
      .onThirdCall().resolves(FAKE_PROJECT_MULTIPLE_COMPLETED)

      const firstResult = await dataSource.getRelevantRuns([FAKE_SHAS[0]])

      expect(firstResult).to.eql({
        current: 1,
        all: [FAKE_SHAS[0]],
        commitsAhead: 0,
      })

      //passing true to preserveCurrentRun to simulate being on the Debug page when this is called
      const secondResult = await dataSource.getRelevantRuns([FAKE_SHAS[1], FAKE_SHAS[0]], true)

      expect(secondResult).to.eql({
        current: 1,
        all: [FAKE_SHAS[0], FAKE_SHAS[1]],
        commitsAhead: 1,
      })

      //TODO refactor to not have to replicate the subscription iterator
      const subscription = ctx.emitter.subscribeTo('relevantRunChange')
      const subValues: any[] = []
      const watchSubscription = async () => {
        for await (const value of subscription) {
          //ignore the first undefined value
          if (value) {
            subValues.push(value)
          }
        }
      }

      // await dataSource.moveToRun(4, [FAKE_SHAS[1], FAKE_SHAS[0]])

      setImmediate(() => {
        subscription.return(undefined)
      })

      await watchSubscription()

      expect(subValues[0]).to.eql({
        all: [FAKE_SHAS[1]],
        current: 4,
        commitsAhead: 0,
      })
    })

    // TODO: this test probably does not make sense anymore
    it.skip('preserves running if switched', async () => {
      const testData = FAKE_PROJECT_MULTIPLE_COMPLETED_PLUS_RUNNING
      const shas = getShasForTestData(testData)

      sinon.stub(ctx.cloud, 'executeRemoteGraphQL')
      .resolves(testData)

      const firstResult = await dataSource.getRelevantRuns(shas)

      expect(firstResult, 'should have completed build as current and running as next').to.eql({
        all: [
          FAKE_PROJECT_MULTIPLE_COMPLETED_PLUS_RUNNING.data.cloudProjectBySlug.runsByCommitShas[0].commitInfo.sha,
          FAKE_PROJECT_MULTIPLE_COMPLETED_PLUS_RUNNING.data.cloudProjectBySlug.runsByCommitShas[1].commitInfo.sha,
        ],
        current: 5,
        commitsAhead: 0,
      })

      // await dataSource.moveToRun(5, [FAKE_SHAS[1], FAKE_SHAS[0]])

      const secondResult = await dataSource.getRelevantRuns(shas)

      expect(secondResult, 'should have switched to the running').to.eql({
        all: [
          FAKE_PROJECT_MULTIPLE_COMPLETED_PLUS_RUNNING.data.cloudProjectBySlug.runsByCommitShas[0].commitInfo.sha,
          FAKE_PROJECT_MULTIPLE_COMPLETED_PLUS_RUNNING.data.cloudProjectBySlug.runsByCommitShas[1].commitInfo.sha,
        ],
        current: 5,
        commitsAhead: 0,
      })

      await dataSource.checkRelevantRuns(shas, true)

      const thirdResult = await dataSource.getRelevantRuns(shas)

      expect(thirdResult, 'should still have running as current').to.eql({
        all: [
          FAKE_PROJECT_MULTIPLE_COMPLETED_PLUS_RUNNING.data.cloudProjectBySlug.runsByCommitShas[0].commitInfo.sha,
          FAKE_PROJECT_MULTIPLE_COMPLETED_PLUS_RUNNING.data.cloudProjectBySlug.runsByCommitShas[1].commitInfo.sha,
        ],
        current: 5,
        commitsAhead: 0,
      })
    })
  })
})
