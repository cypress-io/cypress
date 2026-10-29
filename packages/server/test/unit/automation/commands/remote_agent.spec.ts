import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Mock } from 'vitest'
import type { Protocol } from 'devtools-protocol'
import type { SendDebuggerCommand } from '../../../../lib/browsers/cdp-protocol/cdp_automation'
import { CdpRemoteAgent } from '../../../../lib/automation/commands/remote_agent'
import { evaluateInFrameContext } from '../../../../lib/automation/helpers/evaluate_in_frame_context'

type MockedSendDebuggerCommand = SendDebuggerCommand & Mock

describe('remote:agent automation command', () => {
  // @ts-expect-error - partial mock of the frame
  const frame: Protocol.Page.Frame = { id: 'aut' }
  const request = { method: 'resolve', context: { config: {} }, args: [{ type: 'get', selector: '#input' }] }
  const expression = `__cypressAgent.call("resolve", {"config":{}}, [{"type":"get","selector":"#input"}])`

  let send: MockedSendDebuggerCommand
  let contexts: Map<Protocol.Runtime.ExecutionContextId, Protocol.Runtime.ExecutionContextDescription>
  let nextWorldId: number
  let ownerResult: Protocol.Runtime.RemoteObject
  let agent: CdpRemoteAgent

  const addContext = (id: number) => {
    // @ts-expect-error - partial mock of the execution context
    contexts.set(id, { id, auxData: { frameId: frame.id, isDefault: false } })
  }

  const callsTo = (method: string) => send.mock.calls.filter(([name]) => name === method)

  beforeEach(() => {
    contexts = new Map()
    nextWorldId = 10
    ownerResult = { type: 'object', subtype: 'node', objectId: 'iframe-object' }

    send = vi.fn(async (method: string, params?: any) => {
      if (method === 'Page.createIsolatedWorld') {
        const executionContextId = nextWorldId++

        addContext(executionContextId)

        return { executionContextId }
      }

      if (params?.expression === 'agent source') {
        return { result: { type: 'undefined' } }
      }

      if (params?.expression?.startsWith('__cypressAgent.frameOwner')) {
        return { result: ownerResult }
      }

      if (method === 'DOM.describeNode') {
        return { node: { frameId: 'child' } }
      }

      if (method === 'Runtime.releaseObject') {
        return {}
      }

      return { result: { type: 'object', value: { ok: true, value: { elements: [] } } } }
    }) as MockedSendDebuggerCommand

    agent = new CdpRemoteAgent(send, contexts, () => Promise.resolve('agent source'))
  })

  it('loads the agent into an isolated world once and calls it there', async () => {
    expect(await agent.call(frame, request)).toEqual({ ok: true, value: { elements: [] } })
    await agent.call(frame, request)

    expect(callsTo('Page.createIsolatedWorld')).toEqual([['Page.createIsolatedWorld', { frameId: 'aut', worldName: '__cypress_remote_agent' }]])
    expect(callsTo('Runtime.evaluate').map(([, params]) => params)).toEqual([
      { contextId: 10, expression: 'agent source' },
      { contextId: 10, expression, awaitPromise: true, returnByValue: true },
      { contextId: 10, expression, awaitPromise: true, returnByValue: true },
    ])
  })

  it('creates a new world after a navigation destroys the old one', async () => {
    await agent.call(frame, request)
    contexts.delete(10)
    await agent.call(frame, request)

    expect(callsTo('Page.createIsolatedWorld')).toHaveLength(2)
    expect(callsTo('Runtime.evaluate').at(-1)?.[1]).toMatchObject({ contextId: 11, expression })
  })

  it('recreates the world once when the context disappears mid-call', async () => {
    await agent.call(frame, request)

    send.mockImplementationOnce(async () => {
      throw new Error('Cannot find context with specified id')
    })

    expect(await agent.call(frame, request)).toEqual({ ok: true, value: { elements: [] } })
    expect(callsTo('Page.createIsolatedWorld')).toHaveLength(2)
  })

  it('throws when the agent call throws in the page', async () => {
    await agent.call(frame, request)

    send.mockResolvedValueOnce({ result: { type: 'undefined' }, exceptionDetails: { text: 'Uncaught', exception: { description: 'ReferenceError: __cypressAgent is not defined' } } })

    await expect(agent.call(frame, request)).rejects.toThrow(`The remote agent threw while running 'resolve': ReferenceError: __cypressAgent is not defined`)
  })

  describe('with frames to enter', () => {
    const framedRequest = { ...request, frames: [{ steps: [{ type: 'get', selector: '#pay' }], selector: '#pay' }] }

    it('finds the iframe in the AUT frame and calls the agent in the frame it owns', async () => {
      expect(await agent.call(frame, framedRequest)).toEqual({ ok: true, value: { elements: [] } })

      expect(callsTo('Page.createIsolatedWorld').map(([, params]) => params?.frameId)).toEqual(['aut', 'child'])
      expect(callsTo('Runtime.evaluate').map(([, params]) => [params?.contextId, params?.expression])).toEqual([
        [10, 'agent source'],
        [10, '__cypressAgent.frameOwner([{"type":"get","selector":"#pay"}])'],
        [11, 'agent source'],
        [11, expression],
      ])

      expect(callsTo('DOM.describeNode')).toEqual([['DOM.describeNode', { objectId: 'iframe-object' }]])
      expect(callsTo('Runtime.releaseObject')).toEqual([['Runtime.releaseObject', { objectId: 'iframe-object' }]])
    })

    it('returns a retryable error without calling the agent when there is no iframe', async () => {
      ownerResult = { type: 'string', value: 'found <p>, which is not an iframe' }

      expect(await agent.call(frame, framedRequest)).toEqual({
        ok: false,
        error: { name: 'Error', message: 'Expected `#pay` to be an iframe, but found <p>, which is not an iframe.', retry: true },
      })

      expect(callsTo('Page.createIsolatedWorld')).toHaveLength(1)
      expect(callsTo('Runtime.evaluate').map(([, params]) => params?.expression)).not.toContain(expression)
    })
  })

  it('leaves the agent world out of page evaluations', async () => {
    addContext(5)
    // @ts-expect-error - partial mock of the execution context
    contexts.set(6, { id: 6, auxData: { frameId: frame.id, isDefault: true } })

    await evaluateInFrameContext('window.location.href', send, contexts, frame)

    expect(callsTo('Runtime.evaluate')).toEqual([['Runtime.evaluate', { expression: 'window.location.href', contextId: 6 }]])
  })
})
