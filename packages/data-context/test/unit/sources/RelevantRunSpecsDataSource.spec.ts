import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import debugLib from 'debug'
import { GraphQLString, print } from 'graphql'

import { DataContext } from '../../../src'
import { createTestDataContext } from '../helper'
import { RelevantRunSpecsDataSource } from '../../../src/sources'
import { FAKE_PROJECT_ONE_RUNNING_RUN_ONE_SPEC } from './fixtures/graphqlFixtures'
import { createGraphQL } from '../helper-graphql'
import dedent from 'dedent'

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
      const result = await dataSource.getRelevantRunSpecs([])

      expect(result).to.eql([])
    })

    it('returns the runs the cloud sends and sets the polling interval', async () => {
      sinon.stub(ctx.cloud, 'executeRemoteGraphQL').resolves(FAKE_PROJECT_ONE_RUNNING_RUN_ONE_SPEC)

      expect(dataSource.pollingInterval).to.eql(15)

      const result = await dataSource.getRelevantRunSpecs(['fake-id'])

      expect(result).to.eql(FAKE_PROJECT_ONE_RUNNING_RUN_ONE_SPEC.data.cloudNodesByIds)

      expect(dataSource.pollingInterval).to.eql(20)
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

    const configureGraphQL = (cb: (info: Parameters<typeof dataSource.pollForSpecs>[1]) => any) => {
      const query = `
        query Test {
          test {
            value
            value2
          }
        }
      `

      const fields = {
        value: {
          type: GraphQLString,
        },
        value2: {
          type: GraphQLString,
        },
      }

      return createGraphQL(
        query,
        fields,
        (source, args, context, info) => {
          return cb(info)
        },
      )
    }

    it('polls and emits changes', async () => {
      const testData = FAKE_PROJECT_ONE_RUNNING_RUN_ONE_SPEC

      //clone the fixture so it is not modified for future tests
      const FAKE_PROJECT = JSON.parse(JSON.stringify(testData)) as typeof testData

      const runId = testData.data.cloudNodesByIds[0].id

      sinon.stub(ctx.cloud, 'executeRemoteGraphQL').resolves(FAKE_PROJECT)

      return configureGraphQL(async (info) => {
        const subscriptionIterator = dataSource.pollForSpecs(runId, info)

        const firstEmit = await subscriptionIterator.next()

        expect(firstEmit, 'should emit because of first value').to.eql({ done: false, value: FAKE_PROJECT.data.cloudNodesByIds[0] })

        FAKE_PROJECT.data.cloudNodesByIds[0].totalInstanceCount++
        debug('**** tick after total instance count increase')
        await clock.nextAsync()

        const secondEmit = await subscriptionIterator.next()

        expect(secondEmit, 'should emit because of updated "totalInstanceCount"').to.eql({ done: false, value: FAKE_PROJECT.data.cloudNodesByIds[0] })

        FAKE_PROJECT.data.cloudNodesByIds[0].scheduledToCompleteAt = (new Date()).toISOString()
        debug('**** tick after adding scheduledToCompleteAt')
        await clock.nextAsync()

        const thirdEmit = await subscriptionIterator.next()

        expect(thirdEmit, 'should emit again because of updated "scheduledToCompleteAt"').to.eql({ done: false, value: FAKE_PROJECT.data.cloudNodesByIds[0] })

        FAKE_PROJECT.data.cloudNodesByIds[0].totalTests++
        debug('**** tick after testCounts increase')
        await clock.nextAsync()

        const forthEmit = await subscriptionIterator.next()

        expect(forthEmit, 'should emit again because of updated "testCounts"').to.eql({ done: false, value: FAKE_PROJECT.data.cloudNodesByIds[0] })

        FAKE_PROJECT.data.cloudNodesByIds[0].status = 'FAILED'
        debug('**** tick after setting status Failed')
        await clock.nextAsync()

        const finalEmit = await subscriptionIterator.next()

        expect(finalEmit, 'should emit again because of updated "status"').to.eql({ done: false, value: FAKE_PROJECT.data.cloudNodesByIds[0] })

        subscriptionIterator.return(undefined)

        return {}
      }).then((result) => {
        if (result.errors) {
          throw result.errors[0]
        }

        const expected = {
          data: {
            test: {
              value: null,
              value2: null,
            },
          },
        }

        expect(result).to.eql(expected)
      })
    })

    it('should create query', () => {
      const gqlStub = sinon.stub(ctx.cloud, 'executeRemoteGraphQL')

      return configureGraphQL(async (info) => {
        const subscriptionIterator = dataSource.pollForSpecs('runId', info)

        subscriptionIterator.return(undefined)
      }).then(() => {
        const expected =
          dedent`query RelevantRunSpecsDataSource_Specs($ids: [ID!]!) {
                cloudNodesByIds(ids: $ids) {
                  id
                  ... on CloudRun {
                    ...Subscriptions
                  }
                }
                pollingIntervals {
                  runByNumber
                }
              }

              fragment Subscriptions on Test {
                ...Fragment0
              }
              
              fragment Fragment0 on Test {
                value
                value2
              }`

        expect(gqlStub).to.have.been.called
        expect(gqlStub.firstCall.args[0]).to.haveOwnProperty('operationDoc')
        expect(print(gqlStub.firstCall.args[0].operationDoc)).to.eql(`${expected }\n`)
      })
    })
  })
})
