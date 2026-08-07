import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { beginTapTrace, noteTapFailure, recordTapEvent } from '../../../lib/tap/events'
import { resolvedInstanceId } from '../../../lib/cypress-instances'

vi.mock('../../../lib/cypress-instances', async (importActual) => {
  const actual = await importActual<typeof import('../../../lib/cypress-instances')>()

  return {
    ...actual,
    resolvedInstanceId: vi.fn().mockReturnValue(null),
  }
})

const posted = (fetchMock: ReturnType<typeof vi.fn>) => {
  return JSON.parse(fetchMock.mock.calls[0][1].body)
}

describe('lib/tap/events', () => {
  const fetchMock = vi.fn()
  const originalEnv = { ...process.env }

  beforeEach(() => {
    fetchMock.mockReset()
    fetchMock.mockResolvedValue({ status: 200 })
    vi.stubGlobal('fetch', fetchMock)
    delete process.env.CYPRESS_CRASH_REPORTS
    delete process.env.CYPRESS_INTERNAL_EVENT_COLLECTOR_ENV
    vi.mocked(resolvedInstanceId).mockReturnValue(null)
    beginTapTrace('status', ['json'])
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('posts an anonymous event describing the invocation', async () => {
    await recordTapEvent(0, 42)

    expect(fetchMock).toHaveBeenCalledTimes(1)

    const [url, request] = fetchMock.mock.calls[0]

    expect(url).toBe('https://cloud.cypress.io/anon-collect')
    expect(request.method).toBe('POST')
    expect(request.headers['Content-Type']).toBe('application/json')
    expect(request.headers['x-cypress-version']).toEqual(expect.any(String))

    expect(posted(fetchMock)).toEqual({
      campaign: 'Tap Command',
      medium: 'cli',
      messageId: expect.any(String),
      payload: {
        command: 'status',
        flags: ['json'],
        exitCode: 0,
        durationMs: 42,
        cypressVersion: expect.any(String),
      },
    })
  })

  it('carries the id of the instance the command resolved', async () => {
    vi.mocked(resolvedInstanceId).mockReturnValue('a1b2c3d4-0000-4000-8000-000000000000')

    await recordTapEvent(0, 1)

    expect(posted(fetchMock).payload).toMatchObject({ instanceId: 'a1b2c3d4-0000-4000-8000-000000000000' })
  })

  it('omits the instance id when the command never resolved one', async () => {
    await recordTapEvent(1, 1)

    expect(posted(fetchMock).payload).not.toHaveProperty('instanceId')
  })

  it('carries the noted failure code', async () => {
    noteTapFailure('NO_INSTANCE')

    await recordTapEvent(1, 7)

    expect(posted(fetchMock).payload).toMatchObject({ exitCode: 1, errorCode: 'NO_INSTANCE' })
  })

  it('reuses one message id across the events of an invocation', async () => {
    await recordTapEvent(0, 1)
    await recordTapEvent(0, 2)

    const [first, second] = fetchMock.mock.calls.map(([, request]: any) => JSON.parse(request.body))

    expect(first.messageId).toBe(second.messageId)
  })

  it('starts a trace with no failure carried over from the previous command', async () => {
    noteTapFailure('NO_INSTANCE')
    beginTapTrace('specs', [])

    await recordTapEvent(0, 1)

    expect(posted(fetchMock).payload).toMatchObject({ command: 'specs' })
    expect(posted(fetchMock).payload).not.toHaveProperty('errorCode')
  })

  it('reports to the collector environment the app uses', async () => {
    process.env.CYPRESS_INTERNAL_EVENT_COLLECTOR_ENV = 'development'

    await recordTapEvent(0, 1)

    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:3000/anon-collect')
  })

  it('falls back to production for an unrecognized collector environment', async () => {
    process.env.CYPRESS_INTERNAL_EVENT_COLLECTOR_ENV = 'nonsense'

    await recordTapEvent(0, 1)

    expect(fetchMock.mock.calls[0][0]).toBe('https://cloud.cypress.io/anon-collect')
  })

  it('sends nothing when crash reports are turned off', async () => {
    process.env.CYPRESS_CRASH_REPORTS = '0'

    await recordTapEvent(1, 1)

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('stays silent when the collector cannot be reached', async () => {
    fetchMock.mockRejectedValue(new Error('socket hang up'))

    await expect(recordTapEvent(0, 1)).resolves.toBeUndefined()
  })
})
