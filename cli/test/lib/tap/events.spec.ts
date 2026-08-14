import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { beginTapTrace, noteTapCommand, noteTapFailure, reportTapTrace } from '../../../lib/tap/events'
import { resolvedInstanceIdentity } from '../../../lib/cypress-instances'
import { detectAgent } from '@packages/agent-info'
import util, { DEVELOPMENT_VERSION } from '../../../lib/util'

// The suite runs from a source checkout, whose version tells the reporter to stay
// off the collector entirely, so every test states the version it is reporting as.
vi.mock('../../../lib/util', async (importActual) => {
  const actual = await importActual<typeof import('../../../lib/util')>()

  return {
    ...actual,
    default: { ...actual.default, pkgVersion: vi.fn().mockReturnValue('15.0.0') },
  }
})

vi.mock('../../../lib/cypress-instances', async (importActual) => {
  const actual = await importActual<typeof import('../../../lib/cypress-instances')>()

  return {
    ...actual,
    resolvedInstanceIdentity: vi.fn().mockReturnValue(null),
  }
})

// These tests are themselves usually run by an agent, so detection is stubbed rather
// than driven through process.env — the payload must not depend on who ran the suite.
vi.mock('@packages/agent-info', async (importActual) => {
  const actual = await importActual<typeof import('@packages/agent-info')>()

  return {
    ...actual,
    detectAgent: vi.fn().mockReturnValue(undefined),
  }
})

const posted = (fetchMock: ReturnType<typeof vi.fn>) => {
  return JSON.parse(fetchMock.mock.calls[0][1].body)
}

describe('lib/tap/events', () => {
  const fetchMock = vi.fn()
  const dateNow = vi.spyOn(Date, 'now')
  const originalEnv = { ...process.env }

  beforeEach(() => {
    fetchMock.mockReset()
    fetchMock.mockResolvedValue({ status: 200 })
    vi.stubGlobal('fetch', fetchMock)
    delete process.env.CYPRESS_INTERNAL_EVENT_COLLECTOR_ENV
    delete process.env.CYPRESS_INTERNAL_ENV
    delete process.env.CYPRESS_DISABLE_GUEST_TELEMETRY
    vi.mocked(resolvedInstanceIdentity).mockReturnValue(null)
    vi.mocked(detectAgent).mockReturnValue(undefined)
    vi.mocked(util.pkgVersion).mockReturnValue('15.0.0')
    dateNow.mockReturnValue(1_000)
    beginTapTrace({ command: 'status', flags: ['json'] })
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('posts an anonymous event describing the invocation', async () => {
    dateNow.mockReturnValue(1_042)

    await reportTapTrace(0)

    expect(fetchMock).toHaveBeenCalledTimes(1)

    const [url, request] = fetchMock.mock.calls[0]

    expect(url).toBe('https://cloud.cypress.io/anon-collect')
    expect(request.method).toBe('POST')
    expect(request.headers['Content-Type']).toBe('application/json')
    expect(request.headers['x-cypress-version']).toEqual(expect.any(String))

    expect(posted(fetchMock)).toEqual({
      campaign: 'Tap Command',
      medium: 'tap-cli',
      messageId: expect.any(String),
      payload: {
        command: 'status',
        flags: ['json'],
        exitCode: 0,
        durationMs: 42,
      },
    })
  })

  it('carries the id of the instance the command resolved', async () => {
    vi.mocked(resolvedInstanceIdentity).mockReturnValue({ instanceId: 'a1b2c3d4-0000-4000-8000-000000000000', machineId: null, userId: null })

    await reportTapTrace(0)

    expect(posted(fetchMock).payload).toMatchObject({ instanceId: 'a1b2c3d4-0000-4000-8000-000000000000' })
  })

  it('omits the instance id when the command never resolved one', async () => {
    await reportTapTrace(1)

    expect(posted(fetchMock).payload).not.toHaveProperty('instanceId')
  })

  it('reports to the machine collector with the machine id the instance carried', async () => {
    vi.mocked(resolvedInstanceIdentity).mockReturnValue({ instanceId: 'inst-1', machineId: 'machine-hash', userId: null })

    await reportTapTrace(0)

    expect(fetchMock.mock.calls[0][0]).toBe('https://cloud.cypress.io/machine-collect')
    expect(posted(fetchMock).machineId).toBe('machine-hash')
    expect(posted(fetchMock).payload).not.toHaveProperty('machineId')
  })

  it('stays anonymous when the instance reports no machine id', async () => {
    vi.mocked(resolvedInstanceIdentity).mockReturnValue({ instanceId: 'inst-1', machineId: null, userId: null })

    await reportTapTrace(0)

    expect(fetchMock.mock.calls[0][0]).toBe('https://cloud.cypress.io/anon-collect')
    expect(posted(fetchMock)).not.toHaveProperty('machineId')
  })

  it('carries the cloud user id of the instance the command resolved', async () => {
    vi.mocked(resolvedInstanceIdentity).mockReturnValue({ instanceId: 'inst-1', machineId: 'machine-hash', userId: 'cloud-user-1' })

    await reportTapTrace(0)

    expect(posted(fetchMock).payload).toMatchObject({ userId: 'cloud-user-1' })
  })

  it('omits the user id when the instance has no logged-in user', async () => {
    vi.mocked(resolvedInstanceIdentity).mockReturnValue({ instanceId: 'inst-1', machineId: 'machine-hash', userId: null })

    await reportTapTrace(0)

    expect(posted(fetchMock).payload).not.toHaveProperty('userId')
  })

  it('carries the agent that invoked the command', async () => {
    vi.mocked(detectAgent).mockReturnValue('claude')

    await reportTapTrace(0)

    expect(posted(fetchMock).payload).toMatchObject({ agent: 'claude' })
  })

  it('omits the agent when the environment names none', async () => {
    await reportTapTrace(0)

    expect(posted(fetchMock).payload).not.toHaveProperty('agent')
  })

  it('carries the noted failure code', async () => {
    noteTapFailure('NO_INSTANCE')

    await reportTapTrace(1)

    expect(posted(fetchMock).payload).toMatchObject({ exitCode: 1, errorCode: 'NO_INSTANCE' })
  })

  it('reuses one message id across the events of an invocation', async () => {
    await reportTapTrace(0)
    await reportTapTrace(0)

    const [first, second] = fetchMock.mock.calls.map(([, request]: any) => JSON.parse(request.body))

    expect(first.messageId).toBe(second.messageId)
  })

  it('starts a trace with no failure carried over from the previous command', async () => {
    noteTapFailure('NO_INSTANCE')
    beginTapTrace({ command: 'specs', flags: [] })

    await reportTapTrace(0)

    expect(posted(fetchMock).payload).toMatchObject({ command: 'specs' })
    expect(posted(fetchMock).payload).not.toHaveProperty('errorCode')
  })

  it('mints a message id per trace', async () => {
    await reportTapTrace(0)
    beginTapTrace({ command: 'specs', flags: [] })
    await reportTapTrace(0)

    const [first, second] = fetchMock.mock.calls.map(([, request]: any) => JSON.parse(request.body))

    expect(first.messageId).not.toBe(second.messageId)
  })

  it('reports the command as none until a trace names one', async () => {
    beginTapTrace({ command: undefined, flags: ['help'] })

    await reportTapTrace(0)

    expect(posted(fetchMock).payload).toMatchObject({ command: 'none', flags: ['help'] })
  })

  it('reports to the collector environment the app uses', async () => {
    process.env.CYPRESS_INTERNAL_EVENT_COLLECTOR_ENV = 'development'

    await reportTapTrace(0)

    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:3000/anon-collect')
  })

  it('reports to the collector the internal environment names', async () => {
    process.env.CYPRESS_INTERNAL_ENV = 'staging'

    await reportTapTrace(0)

    expect(fetchMock.mock.calls[0][0]).toBe('https://cloud-staging.cypress.io/anon-collect')
  })

  it('prefers the collector environment over the internal one', async () => {
    process.env.CYPRESS_INTERNAL_EVENT_COLLECTOR_ENV = 'staging'
    process.env.CYPRESS_INTERNAL_ENV = 'development'

    await reportTapTrace(0)

    expect(fetchMock.mock.calls[0][0]).toBe('https://cloud-staging.cypress.io/anon-collect')
  })

  it('falls back to production for an unrecognized collector environment', async () => {
    process.env.CYPRESS_INTERNAL_EVENT_COLLECTOR_ENV = 'nonsense'

    await reportTapTrace(0)

    expect(fetchMock.mock.calls[0][0]).toBe('https://cloud.cypress.io/anon-collect')
  })

  it('falls back to production for an internal environment naming no collector', async () => {
    process.env.CYPRESS_INTERNAL_ENV = 'test'

    await reportTapTrace(0)

    expect(fetchMock.mock.calls[0][0]).toBe('https://cloud.cypress.io/anon-collect')
  })

  it('sends nothing from a development build', async () => {
    vi.mocked(util.pkgVersion).mockReturnValue(DEVELOPMENT_VERSION)

    await reportTapTrace(0)

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('sends nothing from a development build whose collector environment is unrecognized', async () => {
    vi.mocked(util.pkgVersion).mockReturnValue(DEVELOPMENT_VERSION)
    process.env.CYPRESS_INTERNAL_EVENT_COLLECTOR_ENV = 'dev'

    await reportTapTrace(0)

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('reports from a development build that names a collector environment', async () => {
    vi.mocked(util.pkgVersion).mockReturnValue(DEVELOPMENT_VERSION)
    process.env.CYPRESS_INTERNAL_EVENT_COLLECTOR_ENV = 'staging'

    await reportTapTrace(0)

    expect(fetchMock.mock.calls[0][0]).toBe('https://cloud-staging.cypress.io/anon-collect')
  })

  it('sends nothing when telemetry is turned off', async () => {
    process.env.CYPRESS_DISABLE_GUEST_TELEMETRY = '1'

    await reportTapTrace(0)

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('sends nothing when telemetry is turned off by npm config', async () => {
    process.env.npm_config_cypress_disable_guest_telemetry = 'true'

    await reportTapTrace(0)

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('reports when the opt-out carries no value', async () => {
    process.env.CYPRESS_DISABLE_GUEST_TELEMETRY = ''

    await reportTapTrace(0)

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('reports no more flags than the payload holds', async () => {
    const declared = Object.fromEntries(Array.from({ length: 40 }, (_value, index) => [`flag-${index}`, 'set']))

    noteTapCommand('status', declared)

    await reportTapTrace(0)

    expect(posted(fetchMock).payload.flags).toHaveLength(25)
  })

  it('stays silent when the collector cannot be reached', async () => {
    fetchMock.mockRejectedValue(new Error('socket hang up'))

    await expect(reportTapTrace(0)).resolves.toBeUndefined()
  })

  // The command's own outcome is already decided by the time this runs, so a throw
  // from anywhere in here would replace it.
  it('stays silent when assembling the event throws', async () => {
    vi.mocked(detectAgent).mockImplementation(() => {
      throw new Error('cannot read the environment')
    })

    await expect(reportTapTrace(0)).resolves.toBeUndefined()

    expect(fetchMock).not.toHaveBeenCalled()
  })
})
