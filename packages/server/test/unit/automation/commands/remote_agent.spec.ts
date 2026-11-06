import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Mock } from 'vitest'
import type { Protocol } from 'devtools-protocol'
import type { SendDebuggerCommand } from '../../../../lib/browsers/cdp-protocol/cdp_automation'
import type { ScriptRemoteValue } from 'webdriver/build/bidi/localTypes'
import { BidiRemoteAgent, CdpRemoteAgent, CdpRemoteTabs, RemoteTabs, WebKitRemoteAgent } from '../../../../lib/automation/commands/remote_agent'
import type { CdpTab } from '../../../../lib/automation/commands/remote_agent'
import { evaluateInFrameContext } from '../../../../lib/automation/helpers/evaluate_in_frame_context'

type MockedSendDebuggerCommand = SendDebuggerCommand & Mock

describe('remote:agent automation command', () => {
  // @ts-expect-error - partial mock of the frame
  const frame: Protocol.Page.Frame = { id: 'aut' }
  const request = { method: 'resolve', context: { config: {} }, args: [{ type: 'get', selector: '#input' }] }
  const expression = `__cypressAgent.call("resolve", {"config":{}}, [{"type":"get","selector":"#input"}])`

  let send: MockedSendDebuggerCommand
  let installedWorlds: Set<number>
  let contexts: Map<Protocol.Runtime.ExecutionContextId, Protocol.Runtime.ExecutionContextDescription>
  let nextWorldId: number
  let ownerResult: Protocol.Runtime.RemoteObject
  let agent: CdpRemoteAgent

  const addContext = (id: number, name?: string) => {
    // @ts-expect-error - partial mock of the execution context
    contexts.set(id, { id, name, auxData: { frameId: frame.id, isDefault: false } })
  }

  const callsTo = (method: string) => send.mock.calls.filter(([name]) => name === method)

  beforeEach(() => {
    contexts = new Map()
    installedWorlds = new Set()
    nextWorldId = 10
    ownerResult = { type: 'object', subtype: 'node', objectId: 'iframe-object' }

    send = vi.fn(async (method: string, params?: any) => {
      if (method === 'Page.createIsolatedWorld') {
        const executionContextId = nextWorldId++

        addContext(executionContextId)

        return { executionContextId }
      }

      if (params?.expression === 'agent source') {
        installedWorlds.add(params.contextId)

        return { result: { type: 'undefined' } }
      }

      if (params?.expression === 'window.__cypressAgent !== undefined') {
        return { result: { type: 'boolean', value: installedWorlds.has(params.contextId) } }
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
      { contextId: 10, expression: 'window.__cypressAgent !== undefined', returnByValue: true },
      { contextId: 10, expression: 'agent source' },
      { contextId: 10, expression, awaitPromise: true, returnByValue: true },
      { contextId: 10, expression, awaitPromise: true, returnByValue: true },
    ])
  })

  it('uses the world the preload created without installing the agent again', async () => {
    addContext(5, '__cypress_remote_agent')
    installedWorlds.add(5)

    await agent.call(frame, request)

    expect(callsTo('Page.createIsolatedWorld')).toEqual([])
    expect(callsTo('Runtime.evaluate').map(([, params]) => params?.expression)).toEqual(['window.__cypressAgent !== undefined', expression])
  })

  it('installs the agent in the preload\'s world when the preload didn\'t', async () => {
    addContext(5, '__cypress_remote_agent')

    await agent.call(frame, request)

    expect(callsTo('Page.createIsolatedWorld')).toEqual([])
    expect(callsTo('Runtime.evaluate').map(([, params]) => [params?.contextId, params?.expression])).toEqual([
      [5, 'window.__cypressAgent !== undefined'],
      [5, 'agent source'],
      [5, expression],
    ])
  })

  it('preloads the agent into its world in every new document, with non-ASCII characters escaped', async () => {
    agent = new CdpRemoteAgent(send, contexts, () => Promise.resolve('agent source \u00e9'))

    await agent.preload()

    const [[, params]] = callsTo('Page.addScriptToEvaluateOnNewDocument')

    expect(params).toMatchObject({ worldName: '__cypress_remote_agent' })
    expect(params.source).toContain('agent source \\u00e9')
    expect([...params.source].every((char) => char.charCodeAt(0) < 0x80)).toBe(true)
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
        [10, 'window.__cypressAgent !== undefined'],
        [10, 'agent source'],
        [10, '__cypressAgent.frameOwner([{"type":"get","selector":"#pay"}])'],
        [11, 'window.__cypressAgent !== undefined'],
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

  describe('over BiDi', () => {
    const callExpression = `(async () => JSON.stringify(await window.__cypressAgent.call("resolve", {"config":{}}, [{"type":"get","selector":"#input"}])))()`
    const guarded = (expr: string) => `window.__cypressAgent === undefined ? "__cypress_remote_agent_missing__" : ${expr}`

    let installed: Set<string>
    let ownerValue: ScriptRemoteValue
    let scriptEvaluate: Mock
    let scriptAddPreloadScript: Mock
    let bidiAgent: BidiRemoteAgent

    const evaluated = () => scriptEvaluate.mock.calls.map(([params]) => params)

    beforeEach(() => {
      installed = new Set()
      ownerValue = { type: 'window', value: { context: 'child' } }

      scriptEvaluate = vi.fn(async ({ expression, target }) => {
        const success = (result: ScriptRemoteValue) => ({ type: 'success', result, realm: 'realm' })

        if (expression === 'agent source') {
          installed.add(target.context)

          return success({ type: 'undefined' })
        }

        if (expression.startsWith('window.__cypressAgent === undefined') && !installed.has(target.context)) {
          return success({ type: 'string', value: '__cypress_remote_agent_missing__' })
        }

        if (expression.includes('__cypressAgent.frameOwner')) {
          return success(ownerValue)
        }

        return success({ type: 'string', value: JSON.stringify({ ok: true, value: { elements: [] } }) })
      })

      scriptAddPreloadScript = vi.fn(async () => ({ script: 'preload' }))

      // @ts-expect-error - partial mock of the webdriver client
      bidiAgent = new BidiRemoteAgent({ scriptEvaluate, scriptAddPreloadScript }, () => Promise.resolve('agent source'))
    })

    it('preloads the agent into its sandbox as a string that only a frame passing the guard evaluates', async () => {
      await bidiAgent.preload()

      const [[params]] = scriptAddPreloadScript.mock.calls

      expect(params.sandbox).toEqual('__cypress_remote_agent')
      expect(params.functionDeclaration).toContain('(0, eval)("agent source")')
    })

    it('installs the agent in the frame\'s sandbox when it is missing and calls it there', async () => {
      expect(await bidiAgent.call('aut', request)).toEqual({ ok: true, value: { elements: [] } })
      await bidiAgent.call('aut', request)

      const target = { context: 'aut', sandbox: '__cypress_remote_agent' }

      expect(evaluated()).toEqual([
        { target, expression: guarded(callExpression), awaitPromise: true },
        { target, expression: 'agent source', awaitPromise: false },
        { target, expression: callExpression, awaitPromise: true },
        { target, expression: guarded(callExpression), awaitPromise: true },
      ])
    })

    it('throws when the agent call throws in the page', async () => {
      installed.add('aut')
      scriptEvaluate.mockResolvedValueOnce({ type: 'exception', exceptionDetails: { text: 'TypeError: boom' }, realm: 'realm' })

      await expect(bidiAgent.call('aut', request)).rejects.toThrow(`The remote agent threw while running 'resolve': TypeError: boom`)
    })

    describe('with frames to enter', () => {
      const framedRequest = { ...request, frames: [{ steps: [{ type: 'get', selector: '#pay' }], selector: '#pay' }] }

      it('finds the iframe\'s browsing context and calls the agent in it', async () => {
        expect(await bidiAgent.call('aut', framedRequest)).toEqual({ ok: true, value: { elements: [] } })

        expect(evaluated().map(({ target, expression }) => [target.context, expression.includes('frameOwner') ? 'frameOwner' : expression])).toEqual([
          ['aut', 'frameOwner'],
          ['aut', 'agent source'],
          ['aut', 'frameOwner'],
          ['child', guarded(callExpression)],
          ['child', 'agent source'],
          ['child', callExpression],
        ])
      })

      it('returns a retryable error without calling the agent when there is no iframe', async () => {
        ownerValue = { type: 'string', value: 'found <p>, which is not an iframe' }

        expect(await bidiAgent.call('aut', framedRequest)).toEqual({
          ok: false,
          error: { name: 'Error', message: 'Expected `#pay` to be an iframe, but found <p>, which is not an iframe.', retry: true },
        })

        expect(evaluated().map(({ target }) => target.context)).not.toContain('child')
      })
    })
  })

  describe('in WebKit', () => {
    const callExpression = `window.__cypressAgent.call("resolve", {"config":{}}, [{"type":"get","selector":"#input"}])`
    const guarded = (expr: string) => `window.__cypressAgent === undefined ? "__cypress_remote_agent_missing__" : ${expr}`
    const utility = { world: 'utility', isFunction: false }

    let ownerHandle: { _value?: unknown, asElement: Mock, dispose: Mock }
    let serverFrames: Map<object, any>
    let autFrame: any
    let webkitAgent: WebKitRemoteAgent

    const makeServerFrame = () => {
      let installed = false

      return {
        _evaluateExpression: vi.fn(async (expression: string) => {
          if (expression === 'agent source') {
            installed = true

            return undefined
          }

          if (expression.startsWith('window.__cypressAgent === undefined') && !installed) {
            return '__cypress_remote_agent_missing__'
          }

          return { ok: true, value: { elements: [] } }
        }),
        _evaluateExpressionHandle: vi.fn(async () => ownerHandle),
      }
    }

    beforeEach(() => {
      serverFrames = new Map()
      autFrame = { _connection: { toImpl: (clientObject: object) => serverFrames.get(clientObject) } }
      serverFrames.set(autFrame, makeServerFrame())
      ownerHandle = { asElement: vi.fn(() => ({ _contentFrame: async () => childFrame })), dispose: vi.fn() }

      webkitAgent = new WebKitRemoteAgent(() => Promise.resolve('agent source'))
    })

    const childFrame = makeServerFrame()

    it('installs the agent in Playwright\'s utility world when it is missing and calls it there', async () => {
      expect(await webkitAgent.call(autFrame, request)).toEqual({ ok: true, value: { elements: [] } })
      await webkitAgent.call(autFrame, request)

      expect(serverFrames.get(autFrame)._evaluateExpression.mock.calls).toEqual([
        [guarded(callExpression), utility],
        ['agent source', utility],
        [callExpression, utility],
        [guarded(callExpression), utility],
      ])
    })

    it('throws when the agent call throws in the page', async () => {
      serverFrames.get(autFrame)._evaluateExpression.mockRejectedValueOnce(new Error('TypeError: boom'))

      await expect(webkitAgent.call(autFrame, request)).rejects.toThrow(`The remote agent threw while running 'resolve': TypeError: boom`)
    })

    it('fails clearly when the frame comes from a client that is not in-process', async () => {
      await expect(webkitAgent.call({} as any, request)).rejects.toThrow('In WebKit, `experimentalRemoteDriver` must be enabled in the config file')
    })

    describe('with frames to enter', () => {
      const framedRequest = { ...request, frames: [{ steps: [{ type: 'get', selector: '#pay' }], selector: '#pay' }] }

      beforeEach(() => {
        childFrame._evaluateExpression.mockClear()
      })

      it('finds the iframe\'s frame and calls the agent in it', async () => {
        expect(await webkitAgent.call(autFrame, framedRequest)).toEqual({ ok: true, value: { elements: [] } })

        expect(serverFrames.get(autFrame)._evaluateExpressionHandle).toHaveBeenCalledWith('window.__cypressAgent.frameOwner([{"type":"get","selector":"#pay"}])', utility)
        expect(ownerHandle.dispose).toHaveBeenCalled()
        expect(childFrame._evaluateExpression.mock.calls.at(-1)).toEqual([callExpression, utility])
      })

      it('returns a retryable error without calling the agent when there is no iframe', async () => {
        ownerHandle = { _value: 'found <p>, which is not an iframe', asElement: vi.fn(() => null), dispose: vi.fn() }

        expect(await webkitAgent.call(autFrame, framedRequest)).toEqual({
          ok: false,
          error: { name: 'Error', message: 'Expected `#pay` to be an iframe, but found <p>, which is not an iframe.', retry: true },
        })

        expect(ownerHandle.dispose).toHaveBeenCalled()
        expect(childFrame._evaluateExpression).not.toHaveBeenCalled()
      })
    })
  })

  describe('tabs', () => {
    const makeTab = (url: string) => {
      return {
        url: vi.fn(async () => url),
        call: vi.fn(async () => ({ ok: true, value: { elements: [], url } })),
      }
    }

    let tabs: Array<ReturnType<typeof makeTab>>
    let callInAut: Mock
    let remoteTabs: RemoteTabs

    beforeEach(() => {
      tabs = [makeTab('http://login.idp.test/popup'), makeTab('http://www.app.test/help')]
      callInAut = vi.fn(async () => 'in aut')
      remoteTabs = new RemoteTabs(() => tabs)
    })

    it('calls the AUT when the request names no tab', async () => {
      expect(await remoteTabs.call(request, callInAut)).toBe('in aut')
      expect(tabs[0].call).not.toHaveBeenCalled()
    })

    it('runs in the tab whose URL matches a RegExp', async () => {
      expect(await remoteTabs.call({ ...request, tab: { url: { source: 'idp\\.test', flags: '' } } }, callInAut)).toMatchObject({ value: { url: 'http://login.idp.test/popup' } })
      expect(callInAut).not.toHaveBeenCalled()
    })

    it('matches a string anywhere in the URL', async () => {
      expect(await remoteTabs.call({ ...request, tab: { url: 'help' } }, callInAut)).toMatchObject({ value: { url: 'http://www.app.test/help' } })
    })

    it('uses the newest tab when no URL is given', async () => {
      expect(await remoteTabs.call({ ...request, tab: {} }, callInAut)).toMatchObject({ value: { url: 'http://www.app.test/help' } })
    })

    it('skips a tab whose URL can\'t be read', async () => {
      tabs[1].url.mockRejectedValue(new Error('tab closed'))

      expect(await remoteTabs.call({ ...request, tab: {} }, callInAut)).toMatchObject({ value: { url: 'http://login.idp.test/popup' } })
    })

    it('resolves no elements when no tab matches, so the tab can be awaited closing', async () => {
      expect(await remoteTabs.call({ ...request, tab: { url: 'nowhere' } }, callInAut)).toEqual({ ok: true, value: { elements: [] } })
    })

    it('returns a retryable error for an action when no tab matches', async () => {
      expect(await remoteTabs.call({ ...request, method: 'click', tab: { url: 'nowhere' } }, callInAut)).toEqual({
        ok: false,
        error: { name: 'Error', message: 'Expected to find a tab matching `nowhere`, but never found one.', retry: true },
      })
    })
  })

  describe('CDP tabs', () => {
    const makeCdpTab = (targetId: string, url: string) => {
      const listeners = new Map<string, (params: any) => void>()
      let nextId = 100

      const tabSend = vi.fn(async (method: string, params?: any) => {
        switch (method) {
          case 'Page.getFrameTree':
            return { frameTree: { frame: { id: `${targetId}-frame`, url } } }
          case 'Page.createIsolatedWorld': {
            const id = nextId++

            listeners.get('Runtime.executionContextCreated')?.({ context: { id, auxData: { frameId: params.frameId, isDefault: false } } })

            return { executionContextId: id }
          }
          case 'Runtime.evaluate':
            return params.expression === 'agent source'
              ? { result: { type: 'undefined' } }
              : { result: { type: 'object', value: { ok: true, value: { elements: [], tab: targetId } } } }
          default:
            return {}
        }
      })

      return {
        targetId,
        send: tabSend as SendDebuggerCommand & Mock,
        on: (event: string, cb: (params: any) => void) => listeners.set(event, cb),
      }
    }

    const tabCalls = (tab: { send: Mock }) => tab.send.mock.calls.map(([method]) => method)

    let cdpTabs: Array<CdpTab & { send: Mock }>
    let cdpRemoteTabs: CdpRemoteTabs

    beforeEach(() => {
      cdpTabs = [makeCdpTab('first', 'http://login.idp.test/popup')]
      cdpRemoteTabs = new CdpRemoteTabs(() => cdpTabs, () => Promise.resolve('agent source'))
    })

    it('reads a tab\'s URL from its frame tree', async () => {
      expect(await cdpRemoteTabs.list()[0].url()).toBe('http://login.idp.test/popup')
    })

    it('runs the agent in the tab, enabling Runtime and creating the world once', async () => {
      expect(await cdpRemoteTabs.list()[0].call(request)).toEqual({ ok: true, value: { elements: [], tab: 'first' } })
      await cdpRemoteTabs.list()[0].call(request)

      expect(tabCalls(cdpTabs[0]).filter((method) => method === 'Runtime.enable')).toHaveLength(1)
      expect(tabCalls(cdpTabs[0]).filter((method) => method === 'Page.createIsolatedWorld')).toHaveLength(1)
    })

    it('starts a new agent for a tab that closed and reopened under the same id', async () => {
      await cdpRemoteTabs.list()[0].call(request)
      cdpTabs = []
      cdpRemoteTabs.list()
      cdpTabs = [makeCdpTab('first', 'http://login.idp.test/popup')]
      await cdpRemoteTabs.list()[0].call(request)

      expect(tabCalls(cdpTabs[0])).toContain('Runtime.enable')
    })
  })
})
