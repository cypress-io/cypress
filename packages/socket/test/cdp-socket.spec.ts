import { describe, it, expect, vi } from 'vitest'
import { CDPSocket, CDPSocketServer, DELIVER_TO_BROWSER_SOCKET } from '../lib/node/cdp-socket'
import { decode } from '../lib/utils'

describe('CDPSocketServer', () => {
  it('closes the previous socket when a new client is attached', async () => {
    const makeClient = () => ({ send: vi.fn().mockResolvedValue({}), on: vi.fn(), off: vi.fn() })
    const server = new CDPSocketServer({ path: '/__socket' })
    const first = makeClient()
    const second = makeClient()

    await server.attachCDPClient(first as any)
    await server.attachCDPClient(second as any)

    expect(first.off).toHaveBeenCalledWith('Runtime.bindingCalled', expect.any(Function))
    expect(second.off).not.toHaveBeenCalled()
  })
})

describe('CDPSocket', () => {
  const namespace = '/__socket/default'

  const makeClient = () => {
    let bindingListener: (event: any) => void = () => {}
    const client = {
      send: vi.fn(async (command: string, params?: any): Promise<any> => {
        if (command === 'Runtime.evaluate') return { result: { type: 'object', objectId: 'global-object' } }

        return {}
      }),
      on: vi.fn((event, listener) => {
        bindingListener = listener
      }),
      off: vi.fn(),
      callBinding: (payload: string, executionContextId = 7) => {
        return bindingListener({ name: `cypressSendToServer-${namespace}`, payload, executionContextId })
      },
    }

    return client
  }

  const deliveries = (client: ReturnType<typeof makeClient>) => {
    return client.send.mock.calls.filter(([command]) => command === 'Runtime.callFunctionOn').map(([, params]) => params)
  }

  const decodedArgs = async (params: any) => {
    const [event, , args] = await decode(params.arguments[1].value)

    return [event, ...args]
  }

  // the browser socket's messages arrive as a JSON-stringified encoded payload
  const browserMessage = async (event: string, callbackEvent: string, args: unknown[] = []) => {
    const { encode } = await import('../lib/utils')

    return JSON.stringify(await encode([event, callbackEvent, args], namespace))
  }

  it('passes the payload as a call argument, never in the function source', async () => {
    const client = makeClient()
    const socket = new CDPSocket(client as any, namespace)

    await client.callBinding(await browserMessage('connected', 'cb-1'))
    await socket.emit('some:event', { quote: `it's "x" \\ </script>` })

    const [params] = deliveries(client)

    expect(params.functionDeclaration).toBe(DELIVER_TO_BROWSER_SOCKET)
    expect(params.functionDeclaration).not.toContain('some:event')
    expect(params.arguments[0]).toStrictEqual({ value: namespace })
    expect(typeof params.arguments[1].value).toBe('string')
    expect(params.returnByValue).toBe(true)
    expect(await decodedArgs(params)).toStrictEqual(['some:event', { quote: `it's "x" \\ </script>` }])
    expect(client.send).not.toHaveBeenCalledWith('Runtime.evaluate', expect.anything())
  })

  it('targets the execution context of the last binding call', async () => {
    const client = makeClient()
    const socket = new CDPSocket(client as any, namespace)

    await client.callBinding(await browserMessage('connected', 'cb-1'), 3)
    await socket.emit('first')
    await client.callBinding(await browserMessage('navigated', 'cb-2'), 9)
    await socket.emit('second')

    expect(deliveries(client).map((params) => params.executionContextId)).toStrictEqual([3, 9])
    expect(deliveries(client).every((params) => params.objectId === undefined)).toBe(true)
  })

  it('calls on the default context\'s global before the browser has called the binding', async () => {
    const client = makeClient()
    const socket = new CDPSocket(client as any, namespace)

    await socket.emit('early')
    await vi.waitFor(() => expect(deliveries(client)).toHaveLength(1))

    expect(client.send).toHaveBeenCalledWith('Runtime.evaluate', { expression: 'globalThis' })

    const [params] = deliveries(client)

    expect(params.objectId).toBe('global-object')
    expect(params.executionContextId).toBeUndefined()
    expect(await decodedArgs(params)).toStrictEqual(['early'])
  })

  it('keeps emit order while the no-context lookup is in flight', async () => {
    const client = makeClient()
    let resolveLookup!: (value: any) => void

    client.send.mockImplementationOnce(() => {
      return new Promise((resolve) => {
        resolveLookup = resolve
      })
    })

    const socket = new CDPSocket(client as any, namespace)

    await socket.emit('one')
    await socket.emit('two')
    // the context becomes known while 'one' is still waiting on its lookup
    await client.callBinding(await browserMessage('connected', 'cb-1'), 5)
    await socket.emit('three')

    expect(deliveries(client)).toHaveLength(0)

    resolveLookup({ result: { objectId: 'global-object' } })
    await vi.waitFor(() => expect(deliveries(client)).toHaveLength(3))

    const events = await Promise.all(deliveries(client).map(async (params) => (await decodedArgs(params))[0]))

    expect(events).toStrictEqual(['one', 'two', 'three'])
    expect(deliveries(client).map((params) => params.executionContextId ?? params.objectId)).toStrictEqual(['global-object', 5, 5])
  })

  it('sends in emit order without waiting on earlier deliveries once the context is known', async () => {
    const client = makeClient()
    const socket = new CDPSocket(client as any, namespace)

    await client.callBinding(await browserMessage('connected', 'cb-1'))
    client.send.mockImplementation(() => new Promise(() => {}))

    await Promise.all(['a', 'b', 'c', 'd'].map((event) => socket.emit(event)))

    const events = await Promise.all(deliveries(client).map(async (params) => (await decodedArgs(params))[0]))

    expect(events).toStrictEqual(['a', 'b', 'c', 'd'])
  })

  it('runs the callback when the browser acknowledges with the message uuid', async () => {
    const client = makeClient()
    const socket = new CDPSocket(client as any, namespace)
    const callback = vi.fn()

    await client.callBinding(await browserMessage('connected', 'cb-1'))
    await socket.emit('with:callback', 'arg', callback)

    const [, uuid] = await decode(deliveries(client)[0].arguments[1].value)

    await client.callBinding(await browserMessage(uuid, 'ack-uuid', ['reply']))

    expect(callback).toHaveBeenCalledWith('reply', expect.any(Function))
  })

  it('replies to a browser message through its callback event', async () => {
    const client = makeClient()
    const socket = new CDPSocket(client as any, namespace)

    socket.on('backend:request', (data, reply) => reply({ ok: data }))
    await client.callBinding(await browserMessage('backend:request', 'browser-cb', ['ping']))

    await vi.waitFor(() => expect(deliveries(client)).toHaveLength(1))
    expect(await decodedArgs(deliveries(client)[0])).toStrictEqual(['browser-cb', { ok: 'ping' }])
  })

  it('resolves true and keeps sending when a delivery fails', async () => {
    const client = makeClient()
    const socket = new CDPSocket(client as any, namespace)

    await client.callBinding(await browserMessage('connected', 'cb-1'))
    client.send.mockRejectedValueOnce(new Error('Cannot find context with specified id'))

    await expect(socket.emit('stale')).resolves.toBe(true)
    await expect(socket.emit('next')).resolves.toBe(true)

    expect(deliveries(client)).toHaveLength(2)
  })

  it('resolves true when the no-context lookup fails, and later messages still go out', async () => {
    const client = makeClient()
    const socket = new CDPSocket(client as any, namespace)

    client.send.mockRejectedValueOnce(new Error('Target closed'))

    await expect(socket.emit('lost')).resolves.toBe(true)
    await client.callBinding(await browserMessage('connected', 'cb-1'), 4)
    await socket.emit('after')

    await vi.waitFor(() => expect(deliveries(client)).toHaveLength(1))
    expect(deliveries(client)[0].executionContextId).toBe(4)
  })
})
