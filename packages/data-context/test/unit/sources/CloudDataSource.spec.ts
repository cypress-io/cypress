import { describe, expect, it, jest } from '@jest/globals'
import { execute } from 'graphql'
import { Response } from 'cross-fetch'

import { DataContext } from '../../../src/DataContext'
import { CloudDataResponse, CloudDataSource } from '../../../src/sources'
import { createTestDataContext, scaffoldProject } from '../helper'
import { ExecutionResult } from '@urql/core'
import {
  CLOUD_PROJECT_QUERY,
  CLOUD_PROJECT_RESPONSE,
  FAKE_USER_QUERY,
  FAKE_USER_RESPONSE,
  FAKE_USER_WITH_OPTIONAL_MISSING,
  FAKE_USER_WITH_OPTIONAL_MISSING_RESPONSE,
  FAKE_USER_WITH_OPTIONAL_RESOLVED_RESPONSE,
  FAKE_USER_WITH_REQUIRED_MISSING,
  FAKE_USER_WITH_REQUIRED_RESOLVED_RESPONSE,
} from './fixtures/graphqlFixtures'

describe('CloudDataSource', () => {
  let cloudDataSource: CloudDataSource
  let fetchStub: jest.Mock<() => Promise<Response>>
  let getUserStub: jest.Mock<() => { authToken: string } | null>
  let logoutStub: jest.Mock<() => void>
  let invalidateCacheStub: jest.Mock<() => void>
  let ctx: DataContext

  beforeEach(() => {
    jest.restoreAllMocks()
    fetchStub = jest.fn()
    fetchStub.mockResolvedValue(new Response(JSON.stringify(FAKE_USER_RESPONSE), { status: 200 }))
    getUserStub = jest.fn()
    getUserStub.mockReturnValue({ authToken: '1234' })
    logoutStub = jest.fn()
    invalidateCacheStub = jest.fn()
    ctx = createTestDataContext('open')
    cloudDataSource = new CloudDataSource({
      fetch: fetchStub,
      getUser: getUserStub,
      logout: logoutStub,
      invalidateClientUrqlCache: invalidateCacheStub,
    })
  })

  afterEach(function () {
    ctx.destroy()
  })

  describe('excecuteRemoteGraphQL', () => {
    it('returns immediately with { data: null } when no user is defined', () => {
      getUserStub.mockReturnValue(null)
      const result = cloudDataSource.executeRemoteGraphQL({
        fieldName: 'cloudViewer',
        operationDoc: FAKE_USER_QUERY,
        operationVariables: {},
        operationType: 'query',
      })

      expect(result).toEqual({ data: null })
      expect(fetchStub).not.toHaveBeenCalled()
    })

    it('issues a fetch request for the data when the user is defined', async () => {
      const result = cloudDataSource.executeRemoteGraphQL({
        fieldName: 'cloudViewer',
        operationDoc: FAKE_USER_QUERY,
        operationVariables: {},
        operationType: 'query',
      })

      const resolved = await result

      expect(resolved.data).toEqual(FAKE_USER_RESPONSE.data)
    })

    it('only issues a single fetch if the operation is called twice', async () => {
      const result1 = cloudDataSource.executeRemoteGraphQL({
        fieldName: 'cloudViewer',
        operationDoc: FAKE_USER_QUERY,
        operationVariables: {},
        operationType: 'query',
      })
      const result2 = cloudDataSource.executeRemoteGraphQL({
        fieldName: 'cloudViewer',
        operationDoc: FAKE_USER_QUERY,
        operationVariables: {},
        operationType: 'query',
      })

      expect(result1).toEqual(result2)

      const resolved = await result1

      expect(resolved.data).toEqual(FAKE_USER_RESPONSE.data)
      expect(fetchStub).toHaveBeenCalledTimes(1)
    })

    it('resolves eagerly with the cached data if the data has already been resolved', async () => {
      const result = cloudDataSource.executeRemoteGraphQL({
        fieldName: 'cloudViewer',
        operationDoc: FAKE_USER_QUERY,
        operationVariables: {},
        operationType: 'query',
      })

      await result

      const immediateResult = cloudDataSource.executeRemoteGraphQL({
        fieldName: 'cloudViewer',
        operationDoc: FAKE_USER_QUERY,
        operationVariables: {},
        operationType: 'query',
      })

      expect((immediateResult as ExecutionResult).data).toEqual(FAKE_USER_RESPONSE.data)
      expect(fetchStub).toHaveBeenCalledTimes(1)
    })

    it('when there is a nullable field missing, resolves with the eager result & fetches for the rest', async () => {
      const result = cloudDataSource.executeRemoteGraphQL({
        fieldName: 'cloudViewer',
        operationDoc: FAKE_USER_QUERY,
        operationVariables: {},
        operationType: 'query',
      })

      await result

      fetchStub.mockResolvedValue(new Response(JSON.stringify(FAKE_USER_WITH_OPTIONAL_RESOLVED_RESPONSE), { status: 200 }))

      const immediateResult = cloudDataSource.executeRemoteGraphQL({
        fieldName: 'cloudViewer',
        operationDoc: FAKE_USER_WITH_OPTIONAL_MISSING,
        operationVariables: {},
        operationType: 'query',
      })

      expect((immediateResult as CloudDataResponse).data).toEqual(FAKE_USER_WITH_OPTIONAL_MISSING_RESPONSE.data)
      expect((immediateResult as CloudDataResponse).stale).toEqual(true)

      const executingResponse = await (immediateResult as CloudDataResponse).executing

      expect(executingResponse.data).toEqual(FAKE_USER_WITH_OPTIONAL_RESOLVED_RESPONSE.data)

      expect(fetchStub).toHaveBeenCalledTimes(2)
    })

    it('when there is a non-nullable field missing, issues the remote query immediately', async () => {
      const result = cloudDataSource.executeRemoteGraphQL({
        fieldName: 'cloudViewer',
        operationDoc: FAKE_USER_QUERY,
        operationVariables: {},
        operationType: 'query',
      })

      await result

      fetchStub.mockResolvedValue(new Response(JSON.stringify(FAKE_USER_WITH_REQUIRED_RESOLVED_RESPONSE), { status: 200 }))

      const requiredResult = cloudDataSource.executeRemoteGraphQL({
        fieldName: 'cloudViewer',
        operationDoc: FAKE_USER_WITH_REQUIRED_MISSING,
        operationVariables: {},
        operationType: 'query',
      })

      expect(requiredResult).toBeInstanceOf(Promise)

      expect((await requiredResult).data).toEqual(FAKE_USER_WITH_REQUIRED_RESOLVED_RESPONSE.data)

      expect(fetchStub).toHaveBeenCalledTimes(2)
    })

    it('returns error property on response', async () => {
      fetchStub.mockResolvedValue(new Response(JSON.stringify(new Error('Unauthorized')), { status: 200 }))

      const result = cloudDataSource.executeRemoteGraphQL({
        fieldName: 'cloudViewer',
        operationDoc: FAKE_USER_QUERY,
        operationVariables: {},
        operationType: 'query',
      })

      const resolved = await result

      expect(resolved.data).toEqual(undefined)
      expect(resolved.errors).toBeDefined()
      expect(resolved.error?.networkError?.message).toEqual('No Content')
    })

    it('logout user on 401 response', async () => {
      fetchStub.mockResolvedValue(new Response(JSON.stringify(new Error('Unauthorized')), { status: 401 }))

      const result = cloudDataSource.executeRemoteGraphQL({
        fieldName: 'cloudViewer',
        operationDoc: FAKE_USER_QUERY,
        operationVariables: {},
        operationType: 'query',
      })

      const resolved = await result

      expect(resolved.data).toEqual(undefined)
      expect(resolved.errors).toBeDefined()
      expect(resolved.error?.networkError?.message).toEqual('Unauthorized')

      expect(logoutStub).toHaveBeenCalledTimes(1)
    })
  })

  describe('isResolving', () => {
    it('returns false if we are not currently resolving the request', () => {
      const result = cloudDataSource.isResolving({
        operationDoc: FAKE_USER_QUERY,
        operationVariables: {},
      })

      expect(result).toEqual(false)
    })

    it('returns true if we are currently resolving the request', () => {
      cloudDataSource.executeRemoteGraphQL({
        fieldName: 'cloudViewer',
        operationDoc: FAKE_USER_QUERY,
        operationVariables: {},
        operationType: 'query',
      })

      const result = cloudDataSource.isResolving({
        operationDoc: FAKE_USER_QUERY,
        operationVariables: {},
      })

      expect(result).toEqual(true)
    })
  })

  describe('hasResolved', () => {
    it('returns false if we have not resolved the data yet', () => {
      const result = cloudDataSource.hasResolved({
        operationDoc: FAKE_USER_QUERY,
        operationVariables: {},
      })

      expect(result).toEqual(false)
    })

    it('returns true if we have resolved the data for the query', async () => {
      await cloudDataSource.executeRemoteGraphQL({
        fieldName: 'cloudViewer',
        operationDoc: FAKE_USER_QUERY,
        operationVariables: {},
        operationType: 'query',
      })

      const result = cloudDataSource.hasResolved({
        operationDoc: FAKE_USER_QUERY,
        operationVariables: {},
      })

      expect(result).toEqual(true)
    })
  })

  describe('invalidate', () => {
    it('allows us to issue a cache.invalidate on individual fields in the cloud schema', async () => {
      await cloudDataSource.executeRemoteGraphQL({
        fieldName: 'cloudViewer',
        operationDoc: FAKE_USER_QUERY,
        operationVariables: {},
        operationType: 'query',
      })

      expect(cloudDataSource.hasResolved({
        operationDoc: FAKE_USER_QUERY,
        operationVariables: {},
      })).toEqual(true)

      await cloudDataSource.invalidate('Query', 'cloudViewer')

      expect(cloudDataSource.hasResolved({
        operationDoc: FAKE_USER_QUERY,
        operationVariables: {},
      })).toEqual(false)
    })
  })

  describe('delegateCloudField', () => {
    it('delegates a field to the remote schema, which calls executeRemoteGraphQL', async () => {
      fetchStub.mockImplementation(() => {
        return new Promise<Response>((resolve) => {
          setTimeout(() => {
            resolve(new Response(JSON.stringify(CLOUD_PROJECT_RESPONSE), { status: 200 }))
          }, 200)
        })
      })

      Object.defineProperty(ctx, 'cloud', { value: cloudDataSource })

      const dir = await scaffoldProject('component-tests')

      const delegateCloudField = cloudDataSource.delegateCloudField

      const delegateCloudSpy = jest.spyOn(cloudDataSource, 'delegateCloudField').mockImplementation(async function (...args) {
        return delegateCloudField.apply(this, args)
      })

      await ctx.actions.project.setCurrentProject(dir)

      jest.spyOn(ctx.project, 'projectId').mockResolvedValue('abc1234')

      const result = await execute({
        rootValue: {},
        document: CLOUD_PROJECT_QUERY,
        schema: ctx.config.schema,
        contextValue: ctx,
      })

      expect(delegateCloudSpy).toHaveBeenCalledTimes(1)

      expect(result.data).toEqual({
        currentProject: {
          cloudProject: null,
          id: Buffer.from(`CurrentProject:${dir}`, 'utf8').toString('base64'),
        },
      })

      await new Promise((resolve) => setTimeout(resolve, 300))

      const result2 = await execute({
        rootValue: {},
        document: CLOUD_PROJECT_QUERY,
        schema: ctx.config.schema,
        contextValue: ctx,
      })

      expect(result2.data).toEqual({
        currentProject: {
          cloudProject: {
            __typename: 'CloudProject',
            id: '1',
          },
          id: Buffer.from(`CurrentProject:${dir}`, 'utf8').toString('base64'),
        },
      })

      expect(fetchStub).toHaveBeenCalledTimes(1)
    })
  })
})
