import { EventEmitter } from 'events'
import { describe, it, expect, vi } from 'vitest'
import { CDPSocket, CDPSocketServer } from '../lib/node/cdp-socket'
import { encode } from '../lib/utils'

const MAIN_FRAME_ID = 'main-frame'
const TRUSTED_ORIGIN = 'http://localhost:3500'

const makeClient = (childFrameIds: string[] = []) => {
  const client = new EventEmitter() as EventEmitter & { send: ReturnType<typeof vi.fn> }

  client.send = vi.fn(async (command: string) => {
    if (command === 'Page.getFrameTree') {
      return { frameTree: { frame: { id: MAIN_FRAME_ID }, childFrames: childFrameIds.map((id) => ({ frame: { id } })) } }
    }

    return {}
  })

  return client
}

const createContext = (client: EventEmitter, { id, frameId = MAIN_FRAME_ID, origin = TRUSTED_ORIGIN, isDefault = true }: { id: number, frameId?: string, origin?: string, isDefault?: boolean }) => {
  client.emit('Runtime.executionContextCreated', {
    context: { id, origin, name: '', uniqueId: String(id), auxData: { frameId, isDefault } },
  })
}

const callBinding = async (client: EventEmitter, executionContextId: number, event: string, ...args: any[]) => {
  const encoded = await encode([event, 'callback-id', args], '/__socket/default')

  client.emit('Runtime.bindingCalled', {
    name: 'cypressSendToServer-/__socket/default',
    payload: JSON.stringify(encoded),
    executionContextId,
  })
}

const flush = () => new Promise((resolve) => setImmediate(resolve))

const attachServer = async (options: Partial<ConstructorParameters<typeof CDPSocketServer>[0]> = {}, childFrameIds: string[] = []) => {
  const client = makeClient(childFrameIds)
  const server = new CDPSocketServer({ path: '/__socket', isTrustedOrigin: (origin) => origin === TRUSTED_ORIGIN, ...options })
  let socket!: CDPSocket

  server.on('connection', (s) => {
    socket = s
  })

  await server.attachCDPClient(client as any)

  return { client, server, socket }
}

const lastEvaluateContextId = (client: ReturnType<typeof makeClient>) => {
  const evaluateCalls = client.send.mock.calls.filter(([method]) => method === 'Runtime.evaluate')

  return evaluateCalls[evaluateCalls.length - 1]?.[1].contextId
}

describe('CDPSocketServer', () => {
  it('requires an isTrustedOrigin check', () => {
    expect(() => new CDPSocketServer({ path: '/__socket' } as any)).toThrow('CDPSocketServer requires an isTrustedOrigin check')
  })

  it('closes the previous socket when a new client is attached', async () => {
    const server = new CDPSocketServer({ path: '/__socket', isTrustedOrigin: () => true })
    const first = makeClient()
    const second = makeClient()
    const firstOff = vi.spyOn(first, 'off')
    const secondOff = vi.spyOn(second, 'off')

    await server.attachCDPClient(first as any)
    await server.attachCDPClient(second as any)

    expect(firstOff).toHaveBeenCalledWith('Runtime.bindingCalled', expect.any(Function))
    expect(firstOff).toHaveBeenCalledWith('Runtime.executionContextCreated', expect.any(Function))
    expect(secondOff).not.toHaveBeenCalled()
  })

  it('listens for execution contexts before enabling Runtime so existing contexts are replayed to it', async () => {
    const client = makeClient()
    const server = new CDPSocketServer({ path: '/__socket', isTrustedOrigin: () => true })

    client.send.mockImplementation(async (command: string) => {
      if (command === 'Page.getFrameTree') {
        return { frameTree: { frame: { id: MAIN_FRAME_ID } } }
      }

      if (command === 'Runtime.enable') {
        createContext(client, { id: 7 })
      }

      return {}
    })

    let socket!: CDPSocket

    server.on('connection', (s) => {
      socket = s
    })

    await server.attachCDPClient(client as any)

    const listener = vi.fn()

    socket.on('some:event', listener)
    await callBinding(client, 7, 'some:event', 'arg')
    await flush()

    expect(listener).toHaveBeenCalledWith('arg', expect.any(Function))
  })

  it('keeps the current socket working until a new client finishes attaching', async () => {
    const { client, server, socket } = await attachServer()
    const listener = vi.fn()
    let resolveFrameTree!: (value: unknown) => void
    const second = makeClient()

    second.send.mockImplementation((command: string) => {
      return command === 'Page.getFrameTree' ? new Promise((resolve) => resolveFrameTree = resolve) : Promise.resolve({})
    })

    createContext(client, { id: 1 })
    socket.on('some:event', listener)

    const attaching = server.attachCDPClient(second as any)

    await callBinding(client, 1, 'some:event', 'during attach')
    await flush()

    expect(listener).toHaveBeenCalledWith('during attach', expect.any(Function))

    resolveFrameTree({ frameTree: { frame: { id: MAIN_FRAME_ID } } })
    await attaching
  })

  it('keeps the current socket when attaching a new client fails', async () => {
    const { client, server, socket } = await attachServer()
    const listener = vi.fn()
    const second = makeClient()

    second.send.mockRejectedValue(new Error('Target closed'))
    createContext(client, { id: 1 })
    socket.on('some:event', listener)

    await expect(server.attachCDPClient(second as any)).rejects.toThrow('Target closed')
    expect(second.listenerCount('Runtime.executionContextCreated')).toBe(0)

    await callBinding(client, 1, 'some:event', 'after failed attach')
    await flush()

    expect(listener).toHaveBeenCalledWith('after failed attach', expect.any(Function))
  })

  it('applies the same caller rules to namespaces', async () => {
    const client = makeClient()
    const server = new CDPSocketServer({ path: '/__socket', isTrustedOrigin: (origin) => origin === TRUSTED_ORIGIN })
    const namespace = server.of('/data-context')
    let namespaceSocket!: CDPSocket

    namespace.on('connection', (s) => {
      namespaceSocket = s
    })

    await server.attachCDPClient(client as any)

    createContext(client, { id: 1 })
    createContext(client, { id: 2, frameId: 'child-frame' })

    const listener = vi.fn()

    namespaceSocket.on('some:event', listener)

    for (const executionContextId of [2, 1]) {
      const encoded = await encode(['some:event', 'callback-id', [executionContextId]], '/__socket/data-context')

      client.emit('Runtime.bindingCalled', {
        name: 'cypressSendToServer-/__socket/data-context',
        payload: JSON.stringify(encoded),
        executionContextId,
      })
    }

    await flush()

    expect(listener).toHaveBeenCalledOnce()
    expect(listener).toHaveBeenCalledWith(1, expect.any(Function))
  })
})

describe('CDPSocket', () => {
  it('emits via Runtime.evaluate with returnByValue', async () => {
    const cdpClient = {
      send: vi.fn().mockResolvedValue({}),
      on: vi.fn(),
      off: vi.fn(),
    }

    const socket = new CDPSocket(cdpClient as any, '/default', { isAllowed: () => true, latestAllowed: () => 1 } as any)

    await socket.emit('some:event', { foo: 'bar' })

    const evaluateCalls = cdpClient.send.mock.calls.filter(([method]) => method === 'Runtime.evaluate')

    expect(evaluateCalls).toHaveLength(1)
    expect(evaluateCalls[0][1].returnByValue).toBe(true)
  })

  describe('messages to the browser', () => {
    it('go to the newest runner context before the runner has called', async () => {
      const { client, socket } = await attachServer()

      createContext(client, { id: 1 })
      createContext(client, { id: 2, frameId: 'child-frame' })
      createContext(client, { id: 3, origin: 'http://other.test' })
      createContext(client, { id: 4 })
      createContext(client, { id: 5, frameId: 'child-frame' })

      await socket.emit('some:event')

      expect(lastEvaluateContextId(client)).toBe(4)
    })

    it('are not sent while no runner context is known', async () => {
      const { client, socket } = await attachServer()

      createContext(client, { id: 1, origin: 'http://other.test' })
      createContext(client, { id: 2, frameId: 'child-frame' })

      await socket.emit('some:event')

      expect(client.send).not.toHaveBeenCalledWith('Runtime.evaluate', expect.anything())
    })

    it('leave no reply listener behind when not sent', async () => {
      const { socket } = await attachServer()

      await socket.emit('some:event', () => {})

      expect(socket.eventNames()).toStrictEqual([])
    })

    it('move to a newer runner context once the caller\'s context is destroyed', async () => {
      const { client, socket } = await attachServer()

      createContext(client, { id: 1 })
      await callBinding(client, 1, 'some:event')
      await flush()
      createContext(client, { id: 2 })

      await socket.emit('reply:event')
      expect(lastEvaluateContextId(client)).toBe(1)

      client.emit('Runtime.executionContextDestroyed', { executionContextId: 1 })

      await socket.emit('reply:event')
      expect(lastEvaluateContextId(client)).toBe(2)
    })
  })

  describe('binding calls', () => {
    it('accepts a call from the main frame at a trusted origin and replies to its context', async () => {
      const { client, socket } = await attachServer()
      const listener = vi.fn((arg, callback) => callback('reply'))

      createContext(client, { id: 1 })
      socket.on('some:event', listener)

      await callBinding(client, 1, 'some:event', 'arg')
      await flush()

      expect(listener).toHaveBeenCalledWith('arg', expect.any(Function))
      expect(lastEvaluateContextId(client)).toBe(1)
    })

    it('drops a call from a child frame without redirecting replies to it', async () => {
      const { client, socket } = await attachServer()
      const listener = vi.fn()

      createContext(client, { id: 1 })
      createContext(client, { id: 2, frameId: 'child-frame' })
      socket.on('some:event', listener)

      await callBinding(client, 1, 'other:event')
      await callBinding(client, 2, 'some:event', 'arg')
      await flush()

      expect(listener).not.toHaveBeenCalled()

      await socket.emit('reply:event')

      expect(lastEvaluateContextId(client)).toBe(1)
    })

    it('drops a call from the main frame at an untrusted origin', async () => {
      const { client, socket } = await attachServer()
      const listener = vi.fn()

      createContext(client, { id: 3, origin: 'http://other.test' })
      socket.on('some:event', listener)

      await callBinding(client, 3, 'some:event')
      await flush()

      expect(listener).not.toHaveBeenCalled()

      await socket.emit('reply:event')

      expect(client.send).not.toHaveBeenCalledWith('Runtime.evaluate', expect.anything())
    })

    it('drops a call from a non-default context of the main frame', async () => {
      const { client, socket } = await attachServer()
      const listener = vi.fn()

      createContext(client, { id: 4, isDefault: false })
      socket.on('some:event', listener)

      await callBinding(client, 4, 'some:event')
      await flush()

      expect(listener).not.toHaveBeenCalled()
    })

    it('drops a call from an unknown or destroyed context', async () => {
      const { client, socket } = await attachServer()
      const listener = vi.fn()

      createContext(client, { id: 5 })
      client.emit('Runtime.executionContextDestroyed', { executionContextId: 5 })
      socket.on('some:event', listener)

      await callBinding(client, 5, 'some:event')
      await callBinding(client, 99, 'some:event')
      await flush()

      expect(listener).not.toHaveBeenCalled()
    })

    it('drops calls once contexts are cleared', async () => {
      const { client, socket } = await attachServer()
      const listener = vi.fn()

      createContext(client, { id: 6 })
      client.emit('Runtime.executionContextsCleared')
      socket.on('some:event', listener)

      await callBinding(client, 6, 'some:event')
      await flush()

      expect(listener).not.toHaveBeenCalled()
    })

    it('judges the origin when the context is created, not when it calls', async () => {
      let trustedOrigin = TRUSTED_ORIGIN
      const { client, socket } = await attachServer({ isTrustedOrigin: (origin) => origin === trustedOrigin })
      const listener = vi.fn()

      createContext(client, { id: 1 })
      createContext(client, { id: 2, origin: 'http://other.test' })
      trustedOrigin = 'http://other.test'
      socket.on('some:event', listener)

      await callBinding(client, 1, 'some:event', 'from trusted context')
      await callBinding(client, 2, 'some:event', 'from untrusted context')
      await flush()

      expect(listener).toHaveBeenCalledOnce()
      expect(listener).toHaveBeenCalledWith('from trusted context', expect.any(Function))
    })

    it('only judges the origin of contexts that may host the runner', async () => {
      const isTrustedOrigin = vi.fn(() => true)
      const { client } = await attachServer({ isTrustedOrigin })

      createContext(client, { id: 1, origin: 'http://main.test' })
      createContext(client, { id: 2, frameId: 'child-frame', origin: 'http://child.test' })

      expect(isTrustedOrigin.mock.calls).toStrictEqual([['http://main.test']])
    })

    describe('with allowMainFrameChildren', () => {
      it('enables Page so frame attachments are reported', async () => {
        const { client } = await attachServer({ allowMainFrameChildren: true })

        expect(client.send).toHaveBeenCalledWith('Page.enable')
      })

      it('accepts trusted children of the main frame, from the frame tree or attached later', async () => {
        const { client, socket } = await attachServer({ allowMainFrameChildren: true }, ['existing-child'])
        const listener = vi.fn()

        client.emit('Page.frameAttached', { frameId: 'attached-child', parentFrameId: MAIN_FRAME_ID })
        createContext(client, { id: 2, frameId: 'existing-child' })
        createContext(client, { id: 3, frameId: 'attached-child' })
        createContext(client, { id: 4, frameId: 'existing-child', origin: 'http://other.test' })
        socket.on('some:event', listener)

        await callBinding(client, 2, 'some:event', 'existing child')
        await callBinding(client, 3, 'some:event', 'attached child')
        await callBinding(client, 4, 'some:event', 'untrusted child')
        await flush()

        expect(listener.mock.calls.map(([arg]) => arg)).toStrictEqual(['existing child', 'attached child'])
      })

      it('accepts a child whose context is reported before the frame is attached', async () => {
        const { client, socket } = await attachServer({ allowMainFrameChildren: true })
        const listener = vi.fn()

        createContext(client, { id: 2, frameId: 'late-child' })
        client.emit('Page.frameAttached', { frameId: 'late-child', parentFrameId: MAIN_FRAME_ID })
        socket.on('some:event', listener)

        await callBinding(client, 2, 'some:event')
        await flush()

        expect(listener).toHaveBeenCalledOnce()
      })

      it('drops calls from deeper or detached frames', async () => {
        const { client, socket } = await attachServer({ allowMainFrameChildren: true }, ['child'])
        const listener = vi.fn()

        client.emit('Page.frameAttached', { frameId: 'grandchild', parentFrameId: 'child' })
        createContext(client, { id: 2, frameId: 'grandchild' })
        createContext(client, { id: 3, frameId: 'child' })
        client.emit('Page.frameDetached', { frameId: 'child' })
        socket.on('some:event', listener)

        await callBinding(client, 2, 'some:event')
        await callBinding(client, 3, 'some:event')
        await flush()

        expect(listener).not.toHaveBeenCalled()
      })
    })

    it('preserves message order around dropped calls', async () => {
      const { client, socket } = await attachServer()
      const received: string[] = []

      createContext(client, { id: 1 })
      createContext(client, { id: 2, frameId: 'child-frame' })
      socket.on('some:event', (arg) => received.push(arg))

      await callBinding(client, 1, 'some:event', 'first')
      await callBinding(client, 2, 'some:event', 'dropped')
      await callBinding(client, 1, 'some:event', 'second')
      await callBinding(client, 1, 'some:event', 'third')
      await flush()

      expect(received).toStrictEqual(['first', 'second', 'third'])
    })
  })
})
