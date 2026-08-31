import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { querySessionGraphql } from '../../../lib/tap/session-gql'
import { verifySessionRecord } from '../../../lib/cypress-sessions'
import type { LiveSessionState } from '../../../lib/cypress-sessions'

vi.mock('../../../lib/cypress-sessions', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../lib/cypress-sessions')>()),
  verifySessionRecord: vi.fn(),
}))

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

const redirected = { status: 200, redirected: true, json: async () => '<!doctype html>' }

// Whether an unserved path redirects or 404s depends on which of the MITM proxy and
// CDP owns browser traffic in the session, so both have to reach the fallback.
const unserved = [
  ['redirects', redirected],
  ['answers 404', { status: 404, redirected: false, json: async () => '' }],
] as const

describe('lib/tap/session-gql', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.mocked(verifySessionRecord).mockReset()
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

  // Sessions that predate the fixed tap route still serve GraphQL under the default
  // namespace, so an unserved path there is retried rather than failed.
  for (const [condition, answer] of unserved) {
    it(`falls back to the legacy path when the tap route ${condition}`, async () => {
      fetchMock
      .mockResolvedValueOnce(answer)
      .mockResolvedValueOnce(jsonResponse({ data: { currentProject: null } }))

      expect(await querySessionGraphql(session, request)).toEqual({ currentProject: null })

      expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
        'http://127.0.0.1:49200/__cypress/tap/graphql/TapSpecs',
        'http://127.0.0.1:49200/__cypress/graphql/TapSpecs',
      ])
    })
  }

  // Neither path being served is about the session, not the request: the probe says
  // whether it is still there, and so which of the two failures it really is.
  it('reports an outdated session when neither path is served but it is still live', async () => {
    fetchMock.mockResolvedValue(redirected)
    vi.mocked(verifySessionRecord).mockResolvedValue(session)

    await expect(querySessionGraphql(session, request)).rejects.toMatchObject({
      code: 'SESSION_OUTDATED',
      message: expect.stringContaining('TapSpecs'),
    })
  })

  it('reports a stale session when neither path is served and it stopped answering', async () => {
    fetchMock.mockResolvedValue(redirected)
    vi.mocked(verifySessionRecord).mockResolvedValue(null)

    await expect(querySessionGraphql(session, request)).rejects.toMatchObject({
      code: 'STALE_SESSION',
      message: expect.stringContaining('TapSpecs'),
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
