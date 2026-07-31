import { beforeEach, describe, expect, it, vi } from 'vitest'
import CRI from 'chrome-remote-interface'

import type { ReadyInstanceState } from '../../../lib/cypress-instances'
import { CdpErrorMessage, withTapSession } from '../../../lib/tap/tap-session'
import { errors } from '../../../lib/errors'

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
  const client = {
    Target: {
      getTargets: overrides.getTargets ?? vi.fn().mockResolvedValue({ targetInfos: overrides.targetInfos ?? [pageTarget()] }),
      attachToTarget: overrides.attachToTarget ?? vi.fn().mockResolvedValue({ sessionId: 'SID1' }),
      detachFromTarget: vi.fn().mockResolvedValue({}),
    },
    Runtime: {
      evaluate: overrides.evaluate ?? vi.fn().mockResolvedValue({ result: { type: 'object', objectId: 'OBJ1' } }),
      callFunctionOn: overrides.callFunctionOn ?? vi.fn().mockResolvedValue({ result: { type: 'string', value: 'ok' } }),
    },
    close: vi.fn().mockResolvedValue(undefined),
  }

  return client
}

const makeRecord = (overrides: Partial<ReadyInstanceState> = {}): ReadyInstanceState => {
  return {
    schemaVersion: 1,
    pid: 1234,
    projectRoot: PROJECT,
    serverPort: 5555,
    instanceId: 'instance-abc',
    testingType: 'e2e',
    cdpBrowserWsUrl: BROWSER_WS_URL,
    browserName: 'Chrome',
    ...overrides,
  }
}

let instance: ReadyInstanceState

const setup = (client = makeClient(), overrides: Partial<ReadyInstanceState> = {}) => {
  instance = makeRecord(overrides)
  mockConnect.mockResolvedValue(client)

  return { instance, client }
}

const callOnce = (method = 'health', args: unknown[] = []) => {
  return withTapSession(instance, (session) => session.call(method, args))
}

const staleError = () => new Error(CdpErrorMessage.objectNotFound)

const expectError = async (promise: Promise<any>, details: unknown) => {
  const err = await promise.catch((e) => e)

  expect(err.known).toBe(true)
  expect(err.details).toBe(details)

  return err
}

describe('lib/tap/tap-session', () => {
  beforeEach(() => {
    mockConnect.mockReset()
  })

  it('connects to the browser ws, attaches a session, invokes the binding, and returns the decoded result', async () => {
    const { client } = setup()

    const result = await withTapSession(instance, async (session) => {
      return session.call('health')
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

    const results = await withTapSession(instance, async (session) => {
      return [await session.call('getSchema'), await session.call('health')]
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

    const err = await withTapSession(instance, async () => {
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

    await expectError(callOnce(), errors.tapStaleHandle)
    expect(client.Runtime.callFunctionOn).toHaveBeenCalledTimes(2)
  })

  it('throws STALE_HANDLE when the handle is still stale after one retry', async () => {
    const evaluate = vi.fn().mockResolvedValue({ result: { type: 'object', objectId: 'OBJ1' } })
    const callFunctionOn = vi.fn().mockRejectedValue(staleError())

    const { client } = setup(makeClient({ evaluate, callFunctionOn }))

    await expectError(callOnce(), errors.tapStaleHandle)

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

    await expectError(callOnce(), errors.tapStaleHandle)
    expect(client.Runtime.evaluate).toHaveBeenCalledTimes(3)
    expect(client.Runtime.callFunctionOn).not.toHaveBeenCalled()
  })

  it('throws CDP_UNREACHABLE when the binding resolve rejects with a non-stale transport error', async () => {
    const evaluate = vi.fn()
    .mockResolvedValueOnce({ result: { type: 'object', objectId: 'OBJ_PROBE' } })
    .mockRejectedValue(new Error('WebSocket connection closed'))

    const { client } = setup(makeClient({ evaluate }))

    await expectError(callOnce(), errors.tapCdpUnreachable)
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

    await expectError(callOnce(), errors.tapBindingNotFound)
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

    await expectError(callOnce(), errors.tapStaleHandle)
    expect(client.Target.getTargets).toHaveBeenCalledTimes(2)
    expect(client.Runtime.callFunctionOn).toHaveBeenCalledOnce()
  })

  it('throws BINDING_NOT_FOUND when no page has the binding mounted, detaching from probed pages', async () => {
    const evaluate = vi.fn().mockResolvedValue({ result: { type: 'undefined' } })
    const { client } = setup(makeClient({ evaluate }))

    await expectError(callOnce(), errors.tapBindingNotFound)
    expect(client.Runtime.callFunctionOn).not.toHaveBeenCalled()
    expect(client.Target.detachFromTarget).toHaveBeenCalledWith({ sessionId: 'SID1' })
  })

  it('throws BINDING_THREW when the binding method throws', async () => {
    const callFunctionOn = vi.fn().mockResolvedValue({
      result: { type: 'object', subtype: 'error' },
      exceptionDetails: { text: 'Uncaught (in promise)', exception: { type: 'object', description: 'Error: boom' } },
    })

    setup(makeClient({ callFunctionOn }))

    const err = await expectError(callOnce(), errors.tapBindingThrew)

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

    await expectError(callOnce(), errors.tapBindingNotFound)
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
    instance = makeRecord()
    mockConnect.mockRejectedValue(new Error('connect ECONNREFUSED'))

    await expectError(callOnce(), errors.tapCdpUnreachable)
  })

  it('throws CDP_UNREACHABLE when listing targets fails', async () => {
    const getTargets = vi.fn().mockRejectedValue(new Error('socket hung up'))

    setup(makeClient({ getTargets }))

    await expectError(callOnce(), errors.tapCdpUnreachable)
  })

  it('throws BINDING_NOT_FOUND when every candidate page fails to attach', async () => {
    const attachToTarget = vi.fn().mockRejectedValue(new Error('No target with given id found'))

    setup(makeClient({ attachToTarget }))

    await expectError(callOnce(), errors.tapBindingNotFound)
  })

  it('throws CDP_UNREACHABLE when the binding call fails with a non-stale error', async () => {
    const callFunctionOn = vi.fn().mockRejectedValue(new Error('socket hung up'))
    const { client } = setup(makeClient({ callFunctionOn }))

    await expectError(callOnce(), errors.tapCdpUnreachable)

    expect(client.Runtime.callFunctionOn).toHaveBeenCalledOnce()
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
