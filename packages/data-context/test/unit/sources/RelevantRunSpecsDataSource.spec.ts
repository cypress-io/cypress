import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import debugLib from 'debug'

import { DataContext } from '../../../src'
import { createTestDataContext } from '../helper'
import { RelevantRunSpecsDataSource, SPECS_EMPTY_RETURN } from '../../../src/sources'
import { FAKE_PROJECT_ONE_RUNNING_RUN_ONE_COMPLETED_THREE_SPECS, FAKE_PROJECT_ONE_RUNNING_RUN_ONE_SPEC } from './fixtures/graphqlFixtures'

chai.use(sinonChai)

const { expect } = chai
const debug = debugLib('cypress:data-context:test:sources:RelevantRunSpecsDataSource')

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
      const result = await dataSource.getRelevantRunSpecs({ current: 11111, commitsAhead: 0, all: [] })

      expect(result).to.eql(SPECS_EMPTY_RETURN)
    })

    it('returns expected specs and statuses when one run is found', async () => {
      sinon.stub(ctx.cloud, 'executeRemoteGraphQL').resolves(FAKE_PROJECT_ONE_RUNNING_RUN_ONE_SPEC)

      const result = await dataSource.getRelevantRunSpecs({ current: 1, commitsAhead: 0, all: [] })

      expect(result).to.eql({
        runSpecs: {
          current: {
            runNumber: 1,
            completedSpecs: 1,
            totalSpecs: 1,
            scheduledToCompleteAt: undefined,
          },
        },
        statuses: { current: 'RUNNING' },
        testCounts: { current: 5 },
      })
    })

    it('returns expected specs and statuses when one run is completed and one is running', async () => {
      sinon.stub(ctx.cloud, 'executeRemoteGraphQL').resolves(FAKE_PROJECT_ONE_RUNNING_RUN_ONE_COMPLETED_THREE_SPECS)

      const result = await dataSource.getRelevantRunSpecs({ current: 1, commitsAhead: 0, all: [] })

      expect(result).to.eql({
        runSpecs: {
          current: {
            runNumber: 1,
            completedSpecs: 3,
            totalSpecs: 3,
            scheduledToCompleteAt: undefined,
          },
        },
        statuses: {
          current: 'PASSED',
        },
        testCounts: { current: 7 },
      })
    })
  })

  describe('polling', () => {
    let clock

    beforeEach(() => {
      clock = sinon.useFakeTimers()
    })

    afterEach(() => {
      clock.restore()
    })

    it('polls and emits changes', async () => {
      const relevantRunChangeStub = sinon.stub(ctx.emitter, 'relevantRunChange')
      const checkRelevantRunsStub = sinon.stub(ctx.relevantRuns, 'checkRelevantRuns')

      //clone the fixture so it is not modified for future tests
      const FAKE_PROJECT = JSON.parse(JSON.stringify(FAKE_PROJECT_ONE_RUNNING_RUN_ONE_SPEC))

      sinon.stub(ctx.cloud, 'executeRemoteGraphQL').resolves(FAKE_PROJECT)

      expect(ctx.relevantRuns.runs).to.eql({
        current: undefined,
        all: [],
        commitsAhead: -1,
      })

      ctx.relevantRuns.runs.current = 1

      const subscriptionIterator = dataSource.pollForSpecs()

      await subscriptionIterator.next()

      FAKE_PROJECT.data.cloudProjectBySlug.current.totalInstanceCount++
      debug('**** tick after total instance count increase')
      await clock.nextAsync()

      //should emit because of updated `totalInstanceCount`
      await subscriptionIterator.next()

      FAKE_PROJECT.data.cloudProjectBySlug.current.scheduledToCompleteAt = (new Date()).toISOString()
      debug('**** tick after adding scheduledToCompleteAt')
      await clock.nextAsync()

      //should emit again because of updated `scheduledToCompleteAt`
      await subscriptionIterator.next()

      FAKE_PROJECT.data.cloudProjectBySlug.current.totalTests++
      debug('**** tick after testCounts increase')
      await clock.nextAsync()

      //should emit run change because total tests increased
      expect(relevantRunChangeStub).to.have.been.calledOnce

      FAKE_PROJECT.data.cloudProjectBySlug.current.status = 'FAILED'
      debug('**** tick after setting status Failed')
      await clock.nextAsync()

      //should call to check relevant runs
      expect(checkRelevantRunsStub).to.have.been.calledTwice

      return subscriptionIterator.return(undefined)
    })
  })
})
