import { expect } from 'chai'
import sinon from 'sinon'
import debugLib from 'debug'

import { DataContext } from '../../../src'
import { createTestDataContext } from '../helper'
import { RelevantRunsDataSource } from '../../../src/sources'
import { FAKE_PROJECT_WITH_ERROR, FAKE_PROJECT_MULTIPLE_COMPLETED, FAKE_PROJECT_MULTIPLE_COMPLETED_PLUS_RUNNING, FAKE_PROJECT_MULTIPLE_COMPLETED_SAME_SHA_PLUS_RUNNING, FAKE_PROJECT_NO_RUNS, FAKE_PROJECT_ONE_RUNNING_RUN, FAKE_SHAS } from './fixtures/graphqlFixtures'
import { RelevantRunInfo } from '../../../src/gen/graphcache-config.gen'

const debug = debugLib('cypress:data-context:test:unit:sources:RelevantRunsDataSource')

const _PROJECTS = [FAKE_PROJECT_MULTIPLE_COMPLETED, FAKE_PROJECT_MULTIPLE_COMPLETED_PLUS_RUNNING, FAKE_PROJECT_NO_RUNS, FAKE_PROJECT_ONE_RUNNING_RUN, FAKE_PROJECT_MULTIPLE_COMPLETED_SAME_SHA_PLUS_RUNNING] as const

type TestProject = typeof _PROJECTS[number]

function formatRun (project: TestProject, index: number) {
  const run = project.data.cloudProjectBySlug.runsByCommitShas?.[index]

  return (({ status, runNumber, commitInfo, totalFailed, id }) => {
    return { status, runNumber, sha: commitInfo.sha, totalFailed, runId: id }
  })(run)
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

    expect(result).to.eql([])
  })

  it('returns empty with no project set', async () => {
    sinon.stub(ctx.project, 'projectId').resolves(undefined)

    const result = await dataSource.getRelevantRuns([FAKE_SHAS[0]])

    expect(result).to.eql([])
  })

  it('returns empty if error', async () => {
    sinon.stub(ctx.cloud, 'executeRemoteGraphQL').resolves(FAKE_PROJECT_WITH_ERROR)
    const result = await dataSource.getRelevantRuns([])

    expect(result).to.eql([])
  })

  context('cloud responses', () => {
    beforeEach(() => {
      sinon.stub(ctx.project, 'projectId').resolves('test123')
    })

    const getShasForTestData = (testData: TestProject) => {
      return testData.data.cloudProjectBySlug.runsByCommitShas.map((run) => run.commitInfo.sha)
    }

    const testScenario = async (testData: TestProject, expectedResult: RelevantRunInfo[]) => {
      sinon.stub(ctx.cloud, 'executeRemoteGraphQL').resolves(testData)

      const testShas: string[] = getShasForTestData(testData)

      const result = await dataSource.getRelevantRuns(testShas)

      expect(result).to.eql(expectedResult)
    }

    it('returns empty if cloud project not loaded', async () => {
      await testScenario(FAKE_PROJECT_NO_RUNS, [])
    })

    it('returns latest RUNNING build as selected if only RUNNING found', async () => {
      await testScenario(FAKE_PROJECT_ONE_RUNNING_RUN, [formatRun(FAKE_PROJECT_ONE_RUNNING_RUN, 0)])
    })

    it('returns all builds when multiple completed', async () => {
      await testScenario(FAKE_PROJECT_MULTIPLE_COMPLETED, [
        formatRun(FAKE_PROJECT_MULTIPLE_COMPLETED, 0),
        formatRun(FAKE_PROJECT_MULTIPLE_COMPLETED, 1),
      ])
    })

    it('returns all builds when running and completed', async () => {
      await testScenario(FAKE_PROJECT_MULTIPLE_COMPLETED_PLUS_RUNNING, [
        formatRun(FAKE_PROJECT_MULTIPLE_COMPLETED_PLUS_RUNNING, 0),
        formatRun(FAKE_PROJECT_MULTIPLE_COMPLETED_PLUS_RUNNING, 1),
        formatRun(FAKE_PROJECT_MULTIPLE_COMPLETED_PLUS_RUNNING, 2),
      ])
    })

    it('returns all builds when multiple on same sha', async () => {
      await testScenario(FAKE_PROJECT_MULTIPLE_COMPLETED_SAME_SHA_PLUS_RUNNING, [
        formatRun(FAKE_PROJECT_MULTIPLE_COMPLETED_SAME_SHA_PLUS_RUNNING, 0),
        formatRun(FAKE_PROJECT_MULTIPLE_COMPLETED_SAME_SHA_PLUS_RUNNING, 1),
        formatRun(FAKE_PROJECT_MULTIPLE_COMPLETED_SAME_SHA_PLUS_RUNNING, 2),
        formatRun(FAKE_PROJECT_MULTIPLE_COMPLETED_SAME_SHA_PLUS_RUNNING, 3),
      ])
    })

    it('returns the same current if current already set only one running', async () => {
      sinon.stub(ctx.cloud, 'executeRemoteGraphQL')
      .onFirstCall().resolves(FAKE_PROJECT_ONE_RUNNING_RUN)
      .onSecondCall().resolves(FAKE_PROJECT_ONE_RUNNING_RUN)

      const firstResult = await dataSource.getRelevantRuns([FAKE_SHAS[0]])

      expect(firstResult, 'running should be current after first check').to.eql(
        [formatRun(FAKE_PROJECT_ONE_RUNNING_RUN, 0)],
      )

      const secondResult = await dataSource.getRelevantRuns([FAKE_SHAS[0]])

      expect(secondResult, 'running should be current after second check').to.eql(
        [formatRun(FAKE_PROJECT_ONE_RUNNING_RUN, 0)],
      )
    })

    it('returns the same current if current already set and updates after movesToNext is called', async () => {
      sinon.stub(ctx.cloud, 'executeRemoteGraphQL')
      .onFirstCall().resolves(FAKE_PROJECT_ONE_RUNNING_RUN)
      .onSecondCall().resolves(FAKE_PROJECT_MULTIPLE_COMPLETED)
      .onThirdCall().resolves(FAKE_PROJECT_MULTIPLE_COMPLETED)

      const maybeSendRunNotificationStub = sinon.stub(ctx.actions.notification, 'maybeSendRunNotification')

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

      //passing true to preserveSelectedRun to simulate being on the Debug page when this is called

      debug('first check with only one running run')
      await dataSource.checkRelevantRuns([FAKE_SHAS[0]], true)

      expect(maybeSendRunNotificationStub).not.to.have.been.called

      debug('second check with the running run completing, but should stay selected')
      await dataSource.checkRelevantRuns([FAKE_SHAS[1], FAKE_SHAS[0]], true)

      expect(maybeSendRunNotificationStub).to.have.been.calledWithMatch(
        { runNumber: 1, status: 'RUNNING', sha: 'fcb90f', totalFailed: 0 },
        { runNumber: 4, status: 'FAILED', sha: 'fc753a', totalFailed: 1 },
      )

      debug('moving runs will cause another check')
      await dataSource.moveToRun(4, [FAKE_SHAS[1], FAKE_SHAS[0]])

      expect(maybeSendRunNotificationStub).to.have.been.calledOnce

      setImmediate(() => {
        subscription.return(undefined)
      })

      await watchSubscription()

      expect(subValues).to.have.lengthOf(3)

      expect(subValues[0], 'should emit first result of running').to.eql({
        all: [formatRun(FAKE_PROJECT_ONE_RUNNING_RUN, 0)],
        commitsAhead: 0,
        latest: [formatRun(FAKE_PROJECT_ONE_RUNNING_RUN, 0)],
        selectedRunNumber: 1,
      })

      expect(subValues[1], 'should keep run if selected but no longer in all').to.eql({
        all: [
          formatRun(FAKE_PROJECT_MULTIPLE_COMPLETED, 0),
          formatRun(FAKE_PROJECT_MULTIPLE_COMPLETED, 1),
        ],
        latest: [
          formatRun(FAKE_PROJECT_MULTIPLE_COMPLETED, 0),
          formatRun(FAKE_PROJECT_MULTIPLE_COMPLETED, 1),
        ],
        commitsAhead: 1,
        selectedRunNumber: 1,
      })

      expect(subValues[2], 'should emit selected run after moving').to.eql({
        all: [formatRun(FAKE_PROJECT_MULTIPLE_COMPLETED, 0)],
        latest: [
          formatRun(FAKE_PROJECT_MULTIPLE_COMPLETED, 0),
          formatRun(FAKE_PROJECT_MULTIPLE_COMPLETED, 1),
        ],
        commitsAhead: 0,
        selectedRunNumber: 4,
      })
    })

    it('moves to new sha once completed', async () => {
      sinon.stub(ctx.cloud, 'executeRemoteGraphQL')
      .onFirstCall().resolves(FAKE_PROJECT_ONE_RUNNING_RUN)
      .onSecondCall().resolves(FAKE_PROJECT_MULTIPLE_COMPLETED)

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

      //simulating being on page other than Debug so not passing preserveSelectedRun

      debug('first check with only one running run')
      await dataSource.checkRelevantRuns([FAKE_SHAS[0]])

      debug('second check with the running run completing, but should stay selected')
      await dataSource.checkRelevantRuns([FAKE_SHAS[1], FAKE_SHAS[0]])

      setImmediate(() => {
        subscription.return(undefined)
      })

      await watchSubscription()

      expect(subValues).to.have.lengthOf(2)

      expect(subValues[0], 'should emit first result of running').to.eql({
        all: [formatRun(FAKE_PROJECT_ONE_RUNNING_RUN, 0)],
        latest: [formatRun(FAKE_PROJECT_ONE_RUNNING_RUN, 0)],
        commitsAhead: 0,
        selectedRunNumber: 1,
      })

      expect(subValues[1], 'should emit newer completed run on different sha').to.eql({
        all: [formatRun(FAKE_PROJECT_MULTIPLE_COMPLETED, 0)],
        latest: [
          formatRun(FAKE_PROJECT_MULTIPLE_COMPLETED, 0),
          formatRun(FAKE_PROJECT_MULTIPLE_COMPLETED, 1),
        ],
        commitsAhead: 0,
        selectedRunNumber: 4,
      })
    })
  })
})
