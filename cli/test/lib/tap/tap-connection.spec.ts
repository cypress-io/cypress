import { beforeEach, describe, expect, it, vi } from 'vitest'
import CRI from 'chrome-remote-interface'

import type { ReadySessionState } from '../../../lib/cypress-sessions'
import { CdpErrorMessage, withTapConnection } from '../../../lib/tap/tap-connection'
import { FIND_SESSION_TIMEOUT_MS } from '../../../lib/tap/cdp-timeout'

vi.mock('chrome-remote-interface', () => ({ default: vi.fn() }))

const RUNNER_ORIGIN = 'http://localhost:5555'
const PROJECT = '/projects/app'
const BROWSER_WS_URL = 'ws://127.0.0.1:9999/devtools/browser/abc-123'

const mockConnect = vi.mocked(CRI as unknown as ReturnType<typeof vi.fn>)

const pageTarget = (targetId = 'T1', url = `${RUNNER_ORIGIN}/__/#/specs/runner`) => {
  return { targetId, type: 'page', url }
}

interface FakeClientOverrides {
  targetInfos?: any[]
  evaluate?: ReturnType<typeof vi.fn>
  callFunctionOn?: ReturnType<typeof vi.fn>
  getTargets?: ReturnType<typeof vi.fn>
  attachToTarget?: ReturnType<typeof vi.fn>
}

const makeClient = (overrides: FakeClientOverrides = {}) => {
  const behaviors: Record<string, ReturnType<typeof vi.fn>> = {
    'Target.getTargets': overrides.getTargets ?? vi.fn().mockResolvedValue({ targetInfos: overrides.targetInfos ?? [pageTarget()] }),
    'Target.attachToTarget': overrides.attachToTarget ?? vi.fn().mockResolvedValue({ sessionId: 'SID1' }),
    'Target.detachFromTarget': vi.fn().mockResolvedValue({}),
    'Runtime.evaluate': overrides.evaluate ?? vi.fn().mockResolvedValue({ result: { type: 'object', objectId: 'OBJ1' } }),
    'Runtime.callFunctionOn': overrides.callFunctionOn ?? vi.fn().mockResolvedValue({ result: { type: 'string', value: 'ok' } }),
  }

  // Mirrors chrome-remote-interface, where every domain shorthand is generated as
  // a `client.send` call — the seam the connection installs its bound on.
  const client: any = {
    send: (command: string, ...args: unknown[]) => behaviors[command](...args),
    close: vi.fn().mockResolvedValue(undefined),
  }

  Object.keys(behaviors).forEach((command) => {
    const [domain, method] = command.split('.')

    client[domain] = client[domain] ?? {}
    client[domain][method] = vi.fn((...args: unknown[]) => client.send(command, ...args))
  })

  return client
}

const makeRecord = (overrides: Partial<ReadySessionState> = {}): ReadySessionState => {
  return {
    schemaVersion: 1,
    pid: 1234,
    projectRoot: PROJECT,
    serverPort: 5555,
    sessionId: 'session-abc',
    testingType: 'e2e',
    cdpBrowserWsUrl: BROWSER_WS_URL,
    browserName: 'Chrome',
    browserFamily: 'chromium',
    machineId: null,
    userId: null,
    ...overrides,
  }
}

let session: ReadySessionState

const setup = (client = makeClient(), overrides: Partial<ReadySessionState> = {}) => {
  session = makeRecord(overrides)
  mockConnect.mockResolvedValue(client)

  return { session, client }
}

const callOnce = (method = 'health', args: unknown[] = []) => {
  return withTapConnection(session, (connection) => connection.call(method, args))
}

const staleError = () => new Error(CdpErrorMessage.objectNotFound)

const UNRESPONSIVE_MS = 25

const never = () => vi.fn().mockReturnValue(new Promise(() => {}))

const callWithBound = () => {
  return withTapConnection(session, (connection) => connection.call('health'), UNRESPONSIVE_MS)
}

const expectUnresponsive = async (promise: Promise<any>) => {
  const err = await promise.catch((e) => e)

  expect(err.code).toBe('RENDERER_UNRESPONSIVE')

  return err
}

const expectError = async (promise: Promise<any>, code: string) => {
  const err = await promise.catch((e) => e)

  expect(err.name).toBe('TapError')
  expect(err.code).toBe(code)

  return err
}

describe('lib/tap/tap-connection', () => {
  beforeEach(() => {
    mockConnect.mockReset()
  })

  it('connects to the browser ws, attaches a session, invokes the binding, and returns the decoded result', async () => {
    const { client } = setup()

    const result = await withTapConnection(session, async (connection) => {
      return connection.call('health')
    })

    expect(result).toBe('ok')
    expect(mockConnect).toHaveBeenCalledWith({ target: BROWSER_WS_URL })

    expect(client.Runtime.evaluate).toHaveBeenCalledTimes(2)
    expect(client.Runtime.evaluate.mock.calls[0][0]).toEqual({ expression: 'window.__CYPRESS_TAP_BINDING__' })
    expect(client.Runtime.evaluate.mock.calls[0][1]).toBe('SID1')
    expect(client.Runtime.evaluate.mock.calls[1][0]).toEqual({ expression: 'window.__CYPRESS_TAP_BINDING__' })

    expect(client.Target.attachToTarget).toHaveBeenCalledWith({ targetId: 'T1', flatten: true })

    expect(client.Runtime.callFunctionOn).toHaveBeenCalledOnce()
    expect(client.Runtime.callFunctionOn.mock.calls[0][0]).toEqual({
      objectId: 'OBJ1',
      functionDeclaration: 'function (method, ...args) { return this[method](...args) }',
      arguments: [{ value: 'health' }],
      returnByValue: true,
      awaitPromise: true,
    })

    expect(client.Runtime.callFunctionOn.mock.calls[0][1]).toBe('SID1')

    expect(client.close).toHaveBeenCalledOnce()
  })

  it('serves multiple calls over one connection (the getSchema handshake + the command)', async () => {
    const callFunctionOn = vi.fn()
    .mockResolvedValueOnce({ result: { type: 'object', value: { protocolVersion: 1, commands: [] } } })
    .mockResolvedValueOnce({ result: { type: 'string', value: 'ok' } })

    const { client } = setup(makeClient({ callFunctionOn }))

    const results = await withTapConnection(session, async (connection) => {
      return [await connection.call('getSchema'), await connection.call('health')]
    })

    expect(results).toEqual([{ protocolVersion: 1, commands: [] }, 'ok'])

    expect(mockConnect).toHaveBeenCalledOnce()
    expect(client.Target.attachToTarget).toHaveBeenCalledOnce()

    expect(client.Runtime.callFunctionOn.mock.calls[0][0].arguments[0]).toEqual({ value: 'getSchema' })
    expect(client.Runtime.callFunctionOn.mock.calls[1][0].arguments[0]).toEqual({ value: 'health' })

    expect(client.close).toHaveBeenCalledOnce()
  })

  it('closes the connection even when fn itself throws', async () => {
    const { client } = setup()
    const boom = new Error('boom')

    const err = await withTapConnection(session, async () => {
      throw boom
    }).catch((e) => e)

    expect(err).toBe(boom)
    expect(client.close).toHaveBeenCalledOnce()
  })

  it('re-acquires the binding and retries once on a stale handle', async () => {
    const evaluate = vi.fn()
    .mockResolvedValueOnce({ result: { type: 'object', objectId: 'OBJ_PROBE' } })
    .mockResolvedValueOnce({ result: { type: 'object', objectId: 'OBJ1' } })
    .mockResolvedValueOnce({ result: { type: 'object', objectId: 'OBJ2' } })

    const callFunctionOn = vi.fn()
    .mockRejectedValueOnce(staleError())
    .mockResolvedValueOnce({ result: { type: 'string', value: 'ok' } })

    const { client } = setup(makeClient({ evaluate, callFunctionOn }))

    expect(await callOnce()).toBe('ok')
    expect(client.Runtime.evaluate).toHaveBeenCalledTimes(3)
    expect(client.Runtime.callFunctionOn).toHaveBeenCalledTimes(2)
    expect(client.Runtime.callFunctionOn.mock.calls[1][0].objectId).toBe('OBJ2')
  })

  it('re-acquires and retries once when the execution context was destroyed mid-call', async () => {
    const evaluate = vi.fn()
    .mockResolvedValueOnce({ result: { type: 'object', objectId: 'OBJ_PROBE' } })
    .mockResolvedValueOnce({ result: { type: 'object', objectId: 'OBJ1' } })
    .mockResolvedValueOnce({ result: { type: 'object', objectId: 'OBJ2' } })

    const callFunctionOn = vi.fn()
    .mockRejectedValueOnce(new Error(CdpErrorMessage.contextDestroyed))
    .mockResolvedValueOnce({ result: { type: 'string', value: 'ok' } })

    const { client } = setup(makeClient({ evaluate, callFunctionOn }))

    expect(await callOnce()).toBe('ok')
    expect(client.Runtime.callFunctionOn).toHaveBeenCalledTimes(2)
    expect(client.Runtime.callFunctionOn.mock.calls[1][0].objectId).toBe('OBJ2')
  })

  it('throws STALE_HANDLE when the context is destroyed again on the retry', async () => {
    const evaluate = vi.fn().mockResolvedValue({ result: { type: 'object', objectId: 'OBJ1' } })
    const callFunctionOn = vi.fn().mockRejectedValue(new Error(CdpErrorMessage.contextDestroyed))

    const { client } = setup(makeClient({ evaluate, callFunctionOn }))

    await expectError(callOnce(), 'STALE_HANDLE')
    expect(client.Runtime.callFunctionOn).toHaveBeenCalledTimes(2)
  })

  it('throws STALE_HANDLE when the handle is still stale after one retry', async () => {
    const evaluate = vi.fn().mockResolvedValue({ result: { type: 'object', objectId: 'OBJ1' } })
    const callFunctionOn = vi.fn().mockRejectedValue(staleError())

    const { client } = setup(makeClient({ evaluate, callFunctionOn }))

    await expectError(callOnce(), 'STALE_HANDLE')

    expect(client.Runtime.evaluate).toHaveBeenCalledTimes(3)
    expect(client.Runtime.callFunctionOn).toHaveBeenCalledTimes(2)
  })

  it('re-acquires and retries once when the binding resolve is destroyed mid-flight', async () => {
    const evaluate = vi.fn()
    .mockResolvedValueOnce({ result: { type: 'object', objectId: 'OBJ_PROBE' } })
    .mockRejectedValueOnce(new Error(CdpErrorMessage.contextDestroyed))
    .mockResolvedValueOnce({ result: { type: 'object', objectId: 'OBJ1' } })

    const { client } = setup(makeClient({ evaluate }))

    expect(await callOnce()).toBe('ok')
    expect(client.Runtime.evaluate).toHaveBeenCalledTimes(3)
    expect(client.Runtime.callFunctionOn).toHaveBeenCalledOnce()
    expect(client.Runtime.callFunctionOn.mock.calls[0][0].objectId).toBe('OBJ1')
  })

  it('throws STALE_HANDLE when the binding resolve is destroyed again on the retry', async () => {
    const evaluate = vi.fn()
    .mockResolvedValueOnce({ result: { type: 'object', objectId: 'OBJ_PROBE' } })
    .mockRejectedValue(new Error(CdpErrorMessage.contextDestroyed))

    const { client } = setup(makeClient({ evaluate }))

    await expectError(callOnce(), 'STALE_HANDLE')
    expect(client.Runtime.evaluate).toHaveBeenCalledTimes(3)
    expect(client.Runtime.callFunctionOn).not.toHaveBeenCalled()
  })

  it('throws CDP_UNREACHABLE when the binding resolve rejects with a non-stale transport error', async () => {
    const evaluate = vi.fn()
    .mockResolvedValueOnce({ result: { type: 'object', objectId: 'OBJ_PROBE' } })
    .mockRejectedValue(new Error('WebSocket connection closed'))

    const { client } = setup(makeClient({ evaluate }))

    await expectError(callOnce(), 'CDP_UNREACHABLE')
    expect(client.Runtime.evaluate).toHaveBeenCalledTimes(2)
    expect(client.Runtime.callFunctionOn).not.toHaveBeenCalled()
  })

  it('re-attaches to the runner page and retries when the session was severed by a cross-process navigation', async () => {
    const attachToTarget = vi.fn()
    .mockResolvedValueOnce({ sessionId: 'SID1' })
    .mockResolvedValueOnce({ sessionId: 'SID2' })

    const callFunctionOn = vi.fn()
    .mockRejectedValueOnce(new Error(CdpErrorMessage.targetGone))
    .mockResolvedValueOnce({ result: { type: 'string', value: 'ok' } })

    const { client } = setup(makeClient({ attachToTarget, callFunctionOn }))

    expect(await callOnce()).toBe('ok')

    expect(client.Target.getTargets).toHaveBeenCalledTimes(2)
    expect(client.Target.attachToTarget).toHaveBeenCalledTimes(2)
    expect(client.Runtime.callFunctionOn.mock.calls[1][1]).toBe('SID2')
  })

  it('throws BINDING_NOT_FOUND from the re-attach while the reloaded runner is still mounting', async () => {
    const evaluate = vi.fn()
    .mockResolvedValueOnce({ result: { type: 'object', objectId: 'OBJ_PROBE' } })
    .mockResolvedValueOnce({ result: { type: 'object', objectId: 'OBJ1' } })
    .mockResolvedValue({ result: { type: 'undefined' } })

    const callFunctionOn = vi.fn().mockRejectedValue(new Error(CdpErrorMessage.targetGone))

    const { client } = setup(makeClient({ evaluate, callFunctionOn }))

    await expectError(callOnce(), 'BINDING_NOT_FOUND')
    expect(client.Target.getTargets).toHaveBeenCalledTimes(2)
  })

  it('throws STALE_HANDLE when the binding resolve hits a severed session again after the re-attach', async () => {
    const evaluate = vi.fn()
    .mockResolvedValueOnce({ result: { type: 'object', objectId: 'OBJ_PROBE' } })
    .mockResolvedValueOnce({ result: { type: 'object', objectId: 'OBJ1' } })
    .mockResolvedValueOnce({ result: { type: 'object', objectId: 'OBJ_PROBE2' } })
    .mockRejectedValue(new Error(CdpErrorMessage.sessionNotFound))

    const callFunctionOn = vi.fn().mockRejectedValue(new Error(CdpErrorMessage.targetGone))

    const { client } = setup(makeClient({ evaluate, callFunctionOn }))

    await expectError(callOnce(), 'STALE_HANDLE')
    expect(client.Target.getTargets).toHaveBeenCalledTimes(2)
    expect(client.Runtime.callFunctionOn).toHaveBeenCalledOnce()
  })

  it('throws BINDING_NOT_FOUND when no page has the binding mounted, detaching from probed pages', async () => {
    const evaluate = vi.fn().mockResolvedValue({ result: { type: 'undefined' } })
    const { client } = setup(makeClient({ evaluate }))

    await expectError(callOnce(), 'BINDING_NOT_FOUND')
    expect(client.Runtime.callFunctionOn).not.toHaveBeenCalled()
    expect(client.Target.detachFromTarget).toHaveBeenCalledWith({ sessionId: 'SID1' })
  })

  it('throws BINDING_THREW when the binding method throws', async () => {
    const callFunctionOn = vi.fn().mockResolvedValue({
      result: { type: 'object', subtype: 'error' },
      exceptionDetails: { text: 'Uncaught (in promise)', exception: { type: 'object', description: 'Error: boom' } },
    })

    setup(makeClient({ callFunctionOn }))

    const err = await expectError(callOnce(), 'BINDING_THREW')

    expect(err.message).toContain('Error: boom')
  })

  it('finds the runner page at a foreign origin (after a cy.visit origin swap)', async () => {
    const client = makeClient({
      targetInfos: [pageTarget('T1', 'http://localhost:8080/__/#/specs/runner?file=app.cy.ts')],
    })

    setup(client)

    expect(await callOnce()).toBe('ok')
    expect(client.Target.attachToTarget).toHaveBeenCalledWith({ targetId: 'T1', flatten: true })
  })

  it('never attaches to non-page targets', async () => {
    const client = makeClient({
      targetInfos: [
        { targetId: 'T1', type: 'service_worker', url: `${RUNNER_ORIGIN}/sw.js` },
        { targetId: 'T2', type: 'iframe', url: `${RUNNER_ORIGIN}/__cypress/iframes/spec` },
      ],
    })

    setup(client)

    await expectError(callOnce(), 'BINDING_NOT_FOUND')
    expect(client.Target.attachToTarget).not.toHaveBeenCalled()
  })

  it('skips pages without the binding and attaches to the one that has it', async () => {
    const attachToTarget = vi.fn()
    .mockResolvedValueOnce({ sessionId: 'SID_AUT' })
    .mockResolvedValueOnce({ sessionId: 'SID_RUNNER' })

    const evaluate = vi.fn().mockImplementation(async (_params, sessionId) => {
      return sessionId === 'SID_RUNNER'
        ? { result: { type: 'object', objectId: 'OBJ1' } }
        : { result: { type: 'undefined' } }
    })

    const client = makeClient({
      targetInfos: [
        pageTarget('T_AUT', 'http://localhost:7777/some/other/page'),
        pageTarget('T_RUNNER', 'http://localhost:8080/__/#/specs/runner?file=app.cy.ts'),
      ],
      attachToTarget,
      evaluate,
    })

    setup(client)

    expect(await callOnce()).toBe('ok')
    expect(client.Runtime.callFunctionOn.mock.calls[0][1]).toBe('SID_RUNNER')
    expect(client.Target.detachFromTarget).toHaveBeenCalledWith({ sessionId: 'SID_AUT' })
  })

  it('keeps probing when attaching to a candidate page fails', async () => {
    const attachToTarget = vi.fn()
    .mockRejectedValueOnce(new Error('No target with given id found'))
    .mockResolvedValueOnce({ sessionId: 'SID1' })

    const client = makeClient({
      targetInfos: [pageTarget('T_CLOSED'), pageTarget('T_RUNNER')],
      attachToTarget,
    })

    setup(client)

    expect(await callOnce()).toBe('ok')
    expect(client.Target.attachToTarget).toHaveBeenCalledTimes(2)
  })

  it('detaches a probed session even when the probe itself throws', async () => {
    const attachToTarget = vi.fn()
    .mockResolvedValueOnce({ sessionId: 'SID_BAD' })
    .mockResolvedValueOnce({ sessionId: 'SID_RUNNER' })

    const evaluate = vi.fn()
    .mockRejectedValueOnce(new Error('Runtime.evaluate threw'))
    .mockResolvedValue({ result: { type: 'object', objectId: 'OBJ1' } })

    const client = makeClient({
      targetInfos: [pageTarget('T_BAD'), pageTarget('T_RUNNER')],
      attachToTarget,
      evaluate,
    })

    setup(client)

    expect(await callOnce()).toBe('ok')
    expect(client.Target.detachFromTarget).toHaveBeenCalledWith({ sessionId: 'SID_BAD' })
    expect(client.Runtime.callFunctionOn.mock.calls[0][1]).toBe('SID_RUNNER')
  })

  it('throws CDP_UNREACHABLE when the browser connection cannot be opened', async () => {
    session = makeRecord()
    mockConnect.mockRejectedValue(new Error('connect ECONNREFUSED'))

    await expectError(callOnce(), 'CDP_UNREACHABLE')
  })

  it('throws CDP_UNREACHABLE when listing targets fails', async () => {
    const getTargets = vi.fn().mockRejectedValue(new Error('socket hung up'))

    setup(makeClient({ getTargets }))

    await expectError(callOnce(), 'CDP_UNREACHABLE')
  })

  it('throws BINDING_NOT_FOUND when every candidate page fails to attach', async () => {
    const attachToTarget = vi.fn().mockRejectedValue(new Error('No target with given id found'))

    setup(makeClient({ attachToTarget }))

    await expectError(callOnce(), 'BINDING_NOT_FOUND')
  })

  it('throws CDP_UNREACHABLE when the binding call fails with a non-stale error', async () => {
    const callFunctionOn = vi.fn().mockRejectedValue(new Error('socket hung up'))
    const { client } = setup(makeClient({ callFunctionOn }))

    await expectError(callOnce(), 'CDP_UNREACHABLE')

    expect(client.Runtime.callFunctionOn).toHaveBeenCalledOnce()
  })

  it('surfaces RENDERER_UNRESPONSIVE when the binding call never answers', async () => {
    setup(makeClient({ callFunctionOn: never() }))

    await expectUnresponsive(callWithBound())
  })

  it('surfaces RENDERER_UNRESPONSIVE when resolving the binding never answers', async () => {
    const evaluate = vi.fn()
    .mockResolvedValueOnce({ result: { type: 'object', objectId: 'OBJ_PROBE' } })
    .mockReturnValue(new Promise(() => {}))

    setup(makeClient({ evaluate }))

    await expectUnresponsive(callWithBound())
  })

  it('surfaces RENDERER_UNRESPONSIVE rather than BINDING_NOT_FOUND when no page can be attached to', async () => {
    setup(makeClient({
      targetInfos: [pageTarget('T1'), pageTarget('T2')],
      attachToTarget: never(),
    }))

    await expectUnresponsive(callWithBound())
  })

  it('surfaces RENDERER_UNRESPONSIVE when listing targets never answers', async () => {
    setup(makeClient({ getTargets: never() }))

    await expectUnresponsive(callWithBound())
  })

  it('bounds the runner-page probe on its own shorter default, so a stuck page falls out of the scan fast', async () => {
    setup(makeClient({ evaluate: never() }))
    vi.useFakeTimers()

    try {
      const settled = callOnce().catch((e) => e)

      await vi.advanceTimersByTimeAsync(FIND_SESSION_TIMEOUT_MS)

      expect((await settled as Error & { code: string }).code).toBe('RENDERER_UNRESPONSIVE')
    } finally {
      vi.useRealTimers()
    }
  })

  it('raises the probe bound along with the call bound, so the shorter one cannot fail underneath --timeout', async () => {
    setup(makeClient({ evaluate: never() }))

    await expectUnresponsive(callWithBound())
  })

  it('attaches to the first page that probes positive when multiple pages have the binding', async () => {
    const client = makeClient({
      targetInfos: [pageTarget('T1'), pageTarget('T2')],
    })

    setup(client)

    expect(await callOnce()).toBe('ok')
    expect(client.Target.attachToTarget).toHaveBeenCalledOnce()
    expect(client.Target.attachToTarget).toHaveBeenCalledWith({ targetId: 'T1', flatten: true })
  })
})
