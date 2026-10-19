import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { EventEmitter } from 'events'
import { CDPSocket } from '../lib/node/cdp-socket'
import { CDPBrowserSocket } from '../lib/client/cdp-browser'

const namespace = '/__socket/default'

const cases: Record<string, unknown> = {
  'quotes': `it's "quoted" and \`backticked\``,
  'backslashes': 'C:\\path\\to\\file \\n is not a newline \\u0041',
  'newlines': 'line 1\nline 2\r\nline 3\ttabbed',
  'line and paragraph separators': 'before\u2028between\u2029after',
  'emoji and astral characters': '😀 👩‍👩‍👧 𝄞 \u{10FFFF}',
  'lone surrogates': ['\ud800', 'a\udfffb', '\udbff\ud800'],
  'closing script tag': '</script><script>alert(1)</script>',
  'nested object': { a: [1, 2, { b: 'c\'d"e\\f' }], n: null, t: true, num: 1.5 },
  'binary attachment': Buffer.from([0, 1, 2, 253, 254, 255]),
}

// Plays the browser: runs whatever the server asks against a fake `window`
// holding a real CDPBrowserSocket, then feeds binding calls back to the server.
class FakeBrowserBridge extends EventEmitter {
  window: Record<string, any> = {}
  contextId = 7
  calls: Array<{ command: string, params: any }> = []

  send = vi.fn(async (command: string, params: any = {}) => {
    this.calls.push({ command, params })

    switch (command) {
      case 'Runtime.enable':
        return
      case 'Runtime.addBinding':
        this.window[params.name] = (payload: string) => {
          this.emit('Runtime.bindingCalled', { name: params.name, payload, executionContextId: this.contextId })
        }

        return
      case 'Runtime.evaluate':
        return { result: { type: 'object', objectId: 'global-object' } }
      case 'Runtime.callFunctionOn': {
        // eslint-disable-next-line no-new-func
        const fn = new Function('window', `return (${params.functionDeclaration})`)(this.window)

        return fn.apply(this.window, params.arguments.map((arg) => arg.value))
      }
      default:
        throw new Error(`unexpected command ${command}`)
    }
  })
}

describe('CDPSocket → CDPBrowserSocket round trip', () => {
  let bridge: FakeBrowserBridge
  let serverSocket: CDPSocket
  let browserSocket: CDPBrowserSocket

  beforeEach(async () => {
    bridge = new FakeBrowserBridge()
    // @ts-expect-error the browser socket reads the global window
    global.window = bridge.window
    serverSocket = await CDPSocket.init(bridge as any, namespace)
    browserSocket = new CDPBrowserSocket(namespace)

    // the browser announces itself, which tells the server its context id
    await new Promise<void>((resolve) => {
      serverSocket.once('hello', () => resolve())
      browserSocket.emit('hello')
    })
  })

  afterEach(() => {
    // @ts-expect-error the Node global has no window property
    delete global.window
  })

  const deliver = (args: unknown[]) => {
    return new Promise<unknown[]>((resolve) => {
      browserSocket.once('message', (...received) => resolve(received))
      serverSocket.emit('message', ...args)
    })
  }

  for (const [name, value] of Object.entries(cases)) {
    it(`delivers ${name} unchanged`, async () => {
      const received = await deliver([value, { wrapped: value }])

      expect(received).toStrictEqual([value, { wrapped: value }])

      const deliveries = bridge.calls.filter(({ command }) => command === 'Runtime.callFunctionOn')

      expect(deliveries.length).toBeGreaterThan(0)
      expect(bridge.calls.filter(({ command }) => command === 'Runtime.evaluate')).toHaveLength(0)
      deliveries.forEach(({ params }) => expect(params.executionContextId).toBe(bridge.contextId))
    })
  }

  it('encodes every case to a well-formed string, so no transport can replace a lone surrogate', async () => {
    const { encode } = await import('../lib/utils')

    for (const value of Object.values(cases)) {
      const encoded = await encode(['message', 'uuid', [value]], namespace)

      expect(typeof encoded).toBe('string')
      expect(encoded.isWellFormed()).toBe(true)
    }
  })

  it('round-trips the callback acknowledgement to the server', async () => {
    const received = vi.fn()

    browserSocket.on('ping', received)

    // the browser acknowledges by emitting the message's uuid back once its listeners ran
    await new Promise<void>((resolve) => {
      serverSocket.emit('ping', 41, () => resolve())
    })

    expect(received).toHaveBeenCalledWith(41)
  })
})
