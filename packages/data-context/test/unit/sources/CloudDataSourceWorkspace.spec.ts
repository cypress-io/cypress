import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { Response } from 'cross-fetch'
import { CloudDataSource } from '../../../src/sources/CloudDataSource'
import { FAKE_USER_QUERY, FAKE_USER_RESPONSE } from './fixtures/graphqlFixtures'

describe('CloudDataSource development workspace', () => {
  const processEnv = process.env

  beforeEach(() => {
    process.env = { ...processEnv }
    delete process.env.CYPRESS_INTERNAL_CLOUD_ENV
    delete process.env.CYPRESS_INTERNAL_WORKSPACE_NUM
  })

  afterEach(() => {
    process.env = processEnv
  })

  const createSource = () => {
    const fetch = jest.fn<() => Promise<Response>>()

    fetch.mockResolvedValue(new Response(JSON.stringify(FAKE_USER_RESPONSE), { status: 200 }))

    return {
      fetch,
      source: new CloudDataSource({
        fetch,
        getUser: () => ({ authToken: 'test-token' }),
        logout: jest.fn(),
        invalidateClientUrqlCache: jest.fn(),
      }),
    }
  }

  it.each([1, 2, 3, 4, 5, 6])('sends GraphQL requests to workspace %s with the development Cloud override', async (workspace) => {
    process.env.CYPRESS_INTERNAL_ENV = 'production'
    process.env.CYPRESS_INTERNAL_CLOUD_ENV = 'development'
    process.env.CYPRESS_INTERNAL_WORKSPACE_NUM = String(workspace)

    const { source, fetch } = createSource()

    await source.executeRemoteGraphQL({
      fieldName: 'cloudViewer',
      operationDoc: FAKE_USER_QUERY,
      operationVariables: {},
      operationType: 'query',
    })

    expect(fetch).toHaveBeenCalledWith(`http://localhost:${(workspace === 1 ? 0 : workspace * 10000) + 3000}/test-runner-graphql`, expect.anything())
  })

  it('resolves workspace URLs per call for Cloud URL consumers', () => {
    process.env.CYPRESS_INTERNAL_ENV = 'production'

    const { source } = createSource()

    process.env.CYPRESS_INTERNAL_WORKSPACE_NUM = '1'
    expect(source.getCloudUrl('development')).toBe('http://localhost:3000')

    process.env.CYPRESS_INTERNAL_WORKSPACE_NUM = '4'
    expect(source.getCloudUrl('development')).toBe('http://localhost:43000')
    expect(source.getCloudUrl('production')).toBe('https://cloud.cypress.io')
    expect(source.getCloudUrl('staging')).toBe('https://cloud-staging.cypress.io')
  })
})
