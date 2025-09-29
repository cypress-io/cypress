import { describe, expect, it, beforeEach, afterEach, jest } from '@jest/globals'
import debugLib from 'debug'
import { GraphQLInt, GraphQLString, print } from 'graphql'

import { DataContext } from '../../../src'
import { createTestDataContext } from '../helper'
import { RelevantRunSpecsDataSource } from '../../../src/sources'
import { FAKE_PROJECT_ONE_RUNNING_RUN_ONE_SPEC } from './fixtures/graphqlFixtures'
import { createGraphQL } from '../helper-graphql'
import dedent from 'dedent'

const debug = debugLib('cypress:data-context:test:sources:RelevantRunSpecsDataSource')

describe('RelevantRunSpecsDataSource', () => {
  let ctx: DataContext
  let dataSource: RelevantRunSpecsDataSource

  beforeEach(() => {
    ctx = createTestDataContext('open')
    dataSource = new RelevantRunSpecsDataSource(ctx)
    jest.spyOn(ctx.project, 'projectId').mockResolvedValue('test123')
  })

  describe('getRelevantRunSpecs()', () => {
    it('returns no specs or statuses when no specs found for run', async () => {
      const result = await dataSource.getRelevantRunSpecs([])

      expect(result).toEqual([])
    })

    it('returns the runs the cloud sends and sets the polling interval', async () => {
      // @ts-expect-error
      jest.spyOn(ctx.cloud, 'executeRemoteGraphQL').mockResolvedValue(FAKE_PROJECT_ONE_RUNNING_RUN_ONE_SPEC)

      expect(dataSource.pollingInterval).toEqual(15)

      const result = await dataSource.getRelevantRunSpecs(['fake-id'])

      expect(result).toEqual(FAKE_PROJECT_ONE_RUNNING_RUN_ONE_SPEC.data.cloudNodesByIds)

      expect(dataSource.pollingInterval).toEqual(20)
    })
  })

  describe('polling', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('polls and emits changes', async () => {
      const testData = FAKE_PROJECT_ONE_RUNNING_RUN_ONE_SPEC

      //clone the fixture so it is not modified for future tests
      const FAKE_PROJECT = JSON.parse(JSON.stringify(testData)) as typeof testData

      const runId = testData.data.cloudNodesByIds[0].id

      // @ts-expect-error
      jest.spyOn(ctx.cloud, 'executeRemoteGraphQL').mockResolvedValue(FAKE_PROJECT)

      const query = `
        query Test {
          test {
            id
            runNumber
            completedInstanceCount
            totalInstanceCount
            totalTests
            status
          }
        }
      `

      const fields = {
        id: {
          type: GraphQLString,
        },
        runNumber: {
          type: GraphQLString,
        },
        completedInstanceCount: {
          type: GraphQLInt,
        },
        totalInstanceCount: {
          type: GraphQLInt,
        },
        totalTests: {
          type: GraphQLInt,
        },
        status: {
          type: GraphQLString,
        },
      }

      const result = await createGraphQL(query, fields, async (source, args, context, info) => {
        const subscriptionIterator = dataSource.pollForSpecs(runId, info)

        const firstEmit = await subscriptionIterator.next()

        // should emit because of first value
        expect(firstEmit).toEqual({ done: false, value: FAKE_PROJECT.data.cloudNodesByIds[0] })

        FAKE_PROJECT.data.cloudNodesByIds[0].totalInstanceCount++
        debug('**** tick after total instance count increase')
        await jest.runOnlyPendingTimers()

        const secondEmit = await subscriptionIterator.next()

        // should emit because of updated "totalInstanceCount"
        expect(secondEmit).toEqual({ done: false, value: FAKE_PROJECT.data.cloudNodesByIds[0] })

        FAKE_PROJECT.data.cloudNodesByIds[0].scheduledToCompleteAt = (new Date()).toISOString()
        debug('**** tick after adding scheduledToCompleteAt')
        await jest.runOnlyPendingTimers()

        const thirdEmit = await subscriptionIterator.next()

        // should emit again because of updated "scheduledToCompleteAt"
        expect(thirdEmit).toEqual({ done: false, value: FAKE_PROJECT.data.cloudNodesByIds[0] })

        FAKE_PROJECT.data.cloudNodesByIds[0].totalTests++
        debug('**** tick after testCounts increase')
        await jest.runOnlyPendingTimers()

        const forthEmit = await subscriptionIterator.next()

        // should emit again because of updated "testCounts"
        expect(forthEmit).toEqual({ done: false, value: FAKE_PROJECT.data.cloudNodesByIds[0] })

        FAKE_PROJECT.data.cloudNodesByIds[0].status = 'FAILED'
        debug('**** tick after setting status Failed')
        await jest.runOnlyPendingTimers()

        const finalEmit = await subscriptionIterator.next()

        // should emit again because of updated "status"
        expect(finalEmit).toEqual({ done: false, value: FAKE_PROJECT.data.cloudNodesByIds[0] })

        subscriptionIterator.return(undefined)

        return {}
      })

      if (result.errors) {
        throw result.errors[0]
      }

      const expected = {
        data: {
          test: {
            completedInstanceCount: null,
            id: null,
            runNumber: null,
            status: null,
            totalInstanceCount: null,
            totalTests: null,
          },
        },
      }

      expect(result).toEqual(expected)
    })

    it('should create query', async () => {
      // @ts-expect-error
      const gqlStub = jest.spyOn(ctx.cloud, 'executeRemoteGraphQL').mockResolvedValue({ data: {} })

      const fields = {
        value: {
          type: GraphQLString,
        },
        value2: {
          type: GraphQLString,
        },
        value3: {
          type: GraphQLString,
        },
      }

      const query = `
        query Test {
          test {
            value
            value2
          }
        }
      `

      const query2 = `
        query Test {
          test {
            value2
            value3
          }
        }
      `

      let iterator1: ReturnType<RelevantRunSpecsDataSource['pollForSpecs']>
      let iterator2: ReturnType<RelevantRunSpecsDataSource['pollForSpecs']>

      await createGraphQL(query, fields, async (source, args, context, info) => {
        iterator1 = dataSource.pollForSpecs('runId', info)
      })

      const firstExpected =
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

      expect(gqlStub).toHaveBeenCalled()
      const gqlStubFirstCallFirstArg = gqlStub.mock.calls[0][0]

      expect(gqlStubFirstCallFirstArg).toHaveProperty('operationDoc')
      // should match initial query with one fragment
      expect(print(gqlStubFirstCallFirstArg.operationDoc)).toEqual(`${firstExpected }\n`)

      await createGraphQL(query2, fields, async (source, args, context, info) => {
        iterator2 = dataSource.pollForSpecs('runId', info)

        await jest.runOnlyPendingTimers()
      })

      const secondExpected =
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
                ...Fragment1
              }
              
              fragment Fragment0 on Test {
                value
                value2
              }
              
              fragment Fragment1 on Test {
                value2
                value3
              }`

      expect(gqlStub).toHaveBeenCalledTimes(2)
      const gqlStubSecondCallFirstArg = gqlStub.mock.calls[1][0]

      expect(gqlStubSecondCallFirstArg).toHaveProperty('operationDoc')
      // should match second query with two fragments
      expect(print(gqlStubSecondCallFirstArg.operationDoc)).toEqual(`${secondExpected }\n`)

      iterator1.return(undefined)
      iterator2.return(undefined)
    })
  })
})
