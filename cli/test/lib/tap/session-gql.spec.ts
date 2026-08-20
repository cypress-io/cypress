import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { querySessionGraphql } from '../../../lib/tap/session-gql'
import type { LiveSessionState } from '../../../lib/cypress-sessions'

const session: LiveSessionState = {
  schemaVersion: 1,
  pid: 4242,
  projectRoot: '/projects/app',
  serverPort: 49200,
  sessionId: 'inst-1',
  testingType: 'e2e',
  cdpBrowserWsUrl: null,
  browserName: null,
  browserFamily: null,
  machineId: null,
  userId: null,
}

const request = {
  operationName: 'TapSpecs',
  query: 'query TapSpecs { currentProject { specs { relative } } }',
}

const jsonResponse = (payload: unknown, status = 200) => ({ status, json: async () => payload })

describe('lib/tap/session-gql', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('posts the operation to the session server port and returns the data', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: { currentProject: null } }))

    const data = await querySessionGraphql(session, request)

    expect(data).toEqual({ currentProject: null })

    const [url, init] = fetchMock.mock.calls[0]

    expect(url).toBe('http://127.0.0.1:49200/__cypress/tap/graphql/TapSpecs')
    expect(init.method).toBe('POST')
    expect(init.headers).toEqual({ 'content-type': 'application/json', 'x-cypress-session-id': 'inst-1' })
    expect(JSON.parse(init.body)).toEqual({ ...request, variables: {} })
  })

  it('maps a network failure to the unreachable error', async () => {
    fetchMock.mockRejectedValue(new Error('connect ECONNREFUSED'))

    await expect(querySessionGraphql(session, request)).rejects.toMatchObject({
      code: 'GRAPHQL_UNREACHABLE',
      message: expect.stringContaining('ECONNREFUSED'),
    })
  })

  it('maps a non-200 answer to the unreachable error', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 500))

    await expect(querySessionGraphql(session, request)).rejects.toMatchObject({
      code: 'GRAPHQL_UNREACHABLE',
      message: expect.stringContaining('500'),
    })
  })

  it('reports an unreachable session when the request is redirected away from GraphQL', async () => {
    fetchMock.mockResolvedValue({ status: 200, redirected: true, json: async () => '<!doctype html>' })

    await expect(querySessionGraphql(session, request)).rejects.toMatchObject({
      code: 'GRAPHQL_REDIRECTED',
      message: expect.stringContaining('redirected'),
    })
  })

  it('surfaces a GraphQL error payload with its message', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ errors: [{ message: 'resolver exploded' }] }))

    await expect(querySessionGraphql(session, request)).rejects.toMatchObject({
      code: 'GRAPHQL_FAILED',
      message: expect.stringContaining('resolver exploded'),
    })
  })

  it('still fails cleanly when the GraphQL error entry is malformed', async () => {
    for (const malformedErrors of [[null], ['boom'], [{}]]) {
      fetchMock.mockResolvedValue(jsonResponse({ errors: malformedErrors }))

      await expect(querySessionGraphql(session, request)).rejects.toMatchObject({
        code: 'GRAPHQL_FAILED',
      })
    }
  })

  it('treats a non-JSON response as a failure', async () => {
    fetchMock.mockResolvedValue({ status: 200, json: async () => {
      throw new Error('unexpected token')
    } })

    await expect(querySessionGraphql(session, request)).rejects.toMatchObject({
      code: 'GRAPHQL_FAILED',
    })
  })

  it('rejects an envelope without usable data', async () => {
    for (const payload of [null, 'junk', {}, { data: null }, { data: 'nope' }, { errors: [] }]) {
      fetchMock.mockResolvedValue(jsonResponse(payload))

      await expect(querySessionGraphql(session, request)).rejects.toMatchObject({
        code: 'GRAPHQL_FAILED',
      })
    }
  })
})
