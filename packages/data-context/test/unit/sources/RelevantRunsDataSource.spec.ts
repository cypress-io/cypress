import { describe, expect, it, beforeEach, jest } from '@jest/globals'
import debugLib from 'debug'

import type { DataContext } from '../../../src'
import { createTestDataContext } from '../helper'
import { RelevantRunsDataSource } from '../../../src/sources'
import { FAKE_PROJECT_WITH_ERROR, FAKE_PROJECT_MULTIPLE_COMPLETED, FAKE_PROJECT_MULTIPLE_COMPLETED_PLUS_RUNNING, FAKE_PROJECT_MULTIPLE_COMPLETED_SAME_SHA_PLUS_RUNNING, FAKE_PROJECT_NO_RUNS, FAKE_PROJECT_ONE_RUNNING_RUN, FAKE_SHAS } from './fixtures/graphqlFixtures'

const debug = debugLib('cypress:data-context:test:unit:sources:RelevantRunsDataSource')

const [firstSha, secondSha] = FAKE_SHAS

if (!firstSha || !secondSha) {
  throw new Error('FAKE_SHAS must hold at least two shas')
}

const _PROJECTS = [FAKE_PROJECT_MULTIPLE_COMPLETED, FAKE_PROJECT_MULTIPLE_COMPLETED_PLUS_RUNNING, FAKE_PROJECT_NO_RUNS, FAKE_PROJECT_ONE_RUNNING_RUN, FAKE_PROJECT_MULTIPLE_COMPLETED_SAME_SHA_PLUS_RUNNING] as const

type TestProject = typeof _PROJECTS[number]

function formatRun (project: TestProject, index: number) {
  const run = project.data.cloudProjectBySlug.runsByCommitShas[index]

  if (!run) {
    throw new Error(`No run at index ${index}`)
  }

  const { status, runNumber, commitInfo, totalFailed } = run

  return { status, runNumber, sha: commitInfo.sha, totalFailed }
}

describe('RelevantRunsDataSource', () => {
  let ctx: DataContext
  let dataSource: RelevantRunsDataSource

  beforeEach(() => {
    ctx = createTestDataContext('open')
    dataSource = new RelevantRunsDataSource(ctx)
    jest.spyOn(ctx.cloud, 'executeRemoteGraphQL').mockReset()
  })

  it('returns empty with no shas', async () => {
    const result = await dataSource.getRelevantRuns([])

    expect(result).toEqual([])
  })

  it('returns empty with no project set', async () => {
    jest.spyOn(ctx.project, 'projectId').mockResolvedValue(null)

    const result = await dataSource.getRelevantRuns([firstSha])

    expect(result).toEqual([])
  })

  it('returns empty if error', async () => {
    // @ts-expect-error - executeRemoteGraphQL can also return synchronously, so jest types mockResolvedValue's argument as never
    jest.spyOn(ctx.cloud, 'executeRemoteGraphQL').mockResolvedValue(FAKE_PROJECT_WITH_ERROR)
    const result = await dataSource.getRelevantRuns([])

    expect(result).toEqual([])
  })

  describe('cloud responses', () => {
    beforeEach(() => {
      jest.spyOn(ctx.project, 'projectId').mockResolvedValue('test123')
    })

    const getShasForTestData = (testData: TestProject) => {
      return testData.data.cloudProjectBySlug.runsByCommitShas
      .map((run) => run.commitInfo.sha)
      .filter((sha): sha is string => sha !== undefined)
    }

    const testScenario = async (testData: TestProject, expectedResult: ReturnType<typeof formatRun>[]) => {
      // @ts-expect-error
      jest.spyOn(ctx.cloud, 'executeRemoteGraphQL').mockResolvedValue(testData)

      const testShas: string[] = getShasForTestData(testData)

      const result = await dataSource.getRelevantRuns(testShas)

      expect(result).toEqual(expectedResult)
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
      jest.spyOn(ctx.cloud, 'executeRemoteGraphQL')
      // @ts-expect-error
      .mockResolvedValueOnce(FAKE_PROJECT_ONE_RUNNING_RUN)
      // @ts-expect-error
      .mockResolvedValueOnce(FAKE_PROJECT_ONE_RUNNING_RUN)

      const firstResult = await dataSource.getRelevantRuns([firstSha])

      // running should be current after first check
      expect(firstResult).toEqual(
        [formatRun(FAKE_PROJECT_ONE_RUNNING_RUN, 0)],
      )

      const secondResult = await dataSource.getRelevantRuns([firstSha])

      // running should be current after second check
      expect(secondResult).toEqual(
        [formatRun(FAKE_PROJECT_ONE_RUNNING_RUN, 0)],
      )
    })

    it('returns the same current if current already set and updates after movesToNext is called', async () => {
      jest.spyOn(ctx.cloud, 'executeRemoteGraphQL')
      // @ts-expect-error
      .mockResolvedValueOnce(FAKE_PROJECT_ONE_RUNNING_RUN)
      // @ts-expect-error
      .mockResolvedValueOnce(FAKE_PROJECT_MULTIPLE_COMPLETED)
      // @ts-expect-error
      .mockResolvedValueOnce(FAKE_PROJECT_MULTIPLE_COMPLETED)

      const maybeSendRunNotificationStub = jest.spyOn(ctx.actions.notification, 'maybeSendRunNotification')

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
      await dataSource.checkRelevantRuns([firstSha], true)

      expect(maybeSendRunNotificationStub).not.toHaveBeenCalled()

      debug('second check with the running run completing, but should stay selected')
      await dataSource.checkRelevantRuns([secondSha, firstSha], true)

      expect(maybeSendRunNotificationStub).toHaveBeenCalledWith(
        // @ts-expect-error
        { runNumber: 1, status: 'RUNNING', sha: 'fcb90f', totalFailed: 0 },
        { runNumber: 4, status: 'FAILED', sha: 'fc753a', totalFailed: 1 },
      )

      debug('moving runs will cause another check')
      await dataSource.moveToRun(4, [secondSha, firstSha])

      expect(maybeSendRunNotificationStub).toHaveBeenCalledTimes(1)

      setImmediate(() => {
        subscription.return(undefined)
      })

      await watchSubscription()

      expect(subValues).toHaveLength(3)

      expect(subValues[0]).toEqual({
        // should emit first result of running
        all: [formatRun(FAKE_PROJECT_ONE_RUNNING_RUN, 0)],
        commitsAhead: 0,
        latest: [formatRun(FAKE_PROJECT_ONE_RUNNING_RUN, 0)],
        selectedRunNumber: 1,
      })

      expect(subValues[1]).toEqual({
        // should keep run if selected but no longer in all
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

      expect(subValues[2]).toEqual({
        // should emit selected run after moving
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
      jest.spyOn(ctx.cloud, 'executeRemoteGraphQL')
      // @ts-expect-error
      .mockResolvedValueOnce(FAKE_PROJECT_ONE_RUNNING_RUN)
      // @ts-expect-error
      .mockResolvedValueOnce(FAKE_PROJECT_MULTIPLE_COMPLETED)

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
      await dataSource.checkRelevantRuns([firstSha])

      debug('second check with the running run completing, but should stay selected')
      await dataSource.checkRelevantRuns([secondSha, firstSha])

      setImmediate(() => {
        subscription.return(undefined)
      })

      await watchSubscription()

      expect(subValues).toHaveLength(2)

      expect(subValues[0]).toEqual({
        // should emit first result of running
        all: [formatRun(FAKE_PROJECT_ONE_RUNNING_RUN, 0)],
        latest: [formatRun(FAKE_PROJECT_ONE_RUNNING_RUN, 0)],
        commitsAhead: 0,
        selectedRunNumber: 1,
      })

      expect(subValues[1]).toEqual({
        // should emit newer completed run on different sha
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
