import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { queryInstanceGraphql } from '../../../lib/tap/instance-gql'
import type { LiveInstanceState } from '../../../lib/cypress-instances'
import { errors } from '../../../lib/errors'

const instance: LiveInstanceState = {
  schemaVersion: 1,
  pid: 4242,
  projectRoot: '/projects/app',
  serverPort: 49200,
  instanceId: 'inst-1',
  testingType: 'e2e',
  cdpBrowserWsUrl: null,
}

const request = {
  operationName: 'TapSpecs',
  query: 'query TapSpecs { currentProject { specs { relative } } }',
}

const jsonResponse = (payload: unknown, status = 200) => ({ status, json: async () => payload })

describe('lib/tap/instance-gql', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('posts the operation to the instance server port and returns the data', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: { currentProject: null } }))

    const data = await queryInstanceGraphql(instance, request)

    expect(data).toEqual({ currentProject: null })

    const [url, init] = fetchMock.mock.calls[0]

    expect(url).toBe('http://127.0.0.1:49200/__cypress/graphql/TapSpecs')
    expect(init.method).toBe('POST')
    expect(init.headers).toEqual({ 'content-type': 'application/json', 'x-cypress-instance-id': 'inst-1' })
    expect(JSON.parse(init.body)).toEqual({ ...request, variables: {} })
  })

  it('maps a network failure to the unreachable error', async () => {
    fetchMock.mockRejectedValue(new Error('connect ECONNREFUSED'))

    await expect(queryInstanceGraphql(instance, request)).rejects.toMatchObject({
      known: true,
      details: errors.tapGraphqlUnreachable,
      message: expect.stringContaining('ECONNREFUSED'),
    })
  })

  it('maps a non-200 answer without a GraphQL envelope to the unreachable error', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 500))

    await expect(queryInstanceGraphql(instance, request)).rejects.toMatchObject({
      known: true,
      details: errors.tapGraphqlUnreachable,
      message: expect.stringContaining('500'),
    })
  })

  it('surfaces a GraphQL error envelope returned with a non-200 status', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ errors: [{ message: 'Cannot query field foo' }] }, 400))

    await expect(queryInstanceGraphql(instance, request)).rejects.toMatchObject({
      known: true,
      details: errors.tapGraphqlFailed,
      message: expect.stringContaining('Cannot query field foo'),
    })
  })

  it('maps a non-200 answer with a non-JSON body to the unreachable error', async () => {
    fetchMock.mockResolvedValue({ status: 502, json: async () => {
      throw new Error('unexpected token')
    } })

    await expect(queryInstanceGraphql(instance, request)).rejects.toMatchObject({
      known: true,
      details: errors.tapGraphqlUnreachable,
      message: expect.stringContaining('502'),
    })
  })

  it('surfaces a GraphQL error payload with its message', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ errors: [{ message: 'resolver exploded' }] }))

    await expect(queryInstanceGraphql(instance, request)).rejects.toMatchObject({
      known: true,
      details: errors.tapGraphqlFailed,
      message: expect.stringContaining('resolver exploded'),
    })
  })

  it('still fails cleanly when the GraphQL error entry is malformed', async () => {
    for (const malformedErrors of [[null], ['boom'], [{}]]) {
      fetchMock.mockResolvedValue(jsonResponse({ errors: malformedErrors }))

      await expect(queryInstanceGraphql(instance, request)).rejects.toMatchObject({
        known: true,
        details: errors.tapGraphqlFailed,
      })
    }
  })

  it('treats a non-JSON response as a failure', async () => {
    fetchMock.mockResolvedValue({ status: 200, json: async () => {
      throw new Error('unexpected token')
    } })

    await expect(queryInstanceGraphql(instance, request)).rejects.toMatchObject({
      known: true,
      details: errors.tapGraphqlFailed,
    })
  })

  it('rejects an envelope without usable data', async () => {
    for (const payload of [null, 'junk', {}, { data: null }, { data: 'nope' }, { errors: [] }]) {
      fetchMock.mockResolvedValue(jsonResponse(payload))

      await expect(queryInstanceGraphql(instance, request)).rejects.toMatchObject({
        known: true,
        details: errors.tapGraphqlFailed,
      })
    }
  })
})
