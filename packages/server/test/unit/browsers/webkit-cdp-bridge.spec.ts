import { beforeEach, describe, expect, it, vi } from 'vitest'
import { WebKitCDPBridge } from '../../../lib/browsers/webkit-cdp-bridge'

describe('lib/browsers/webkit-cdp-bridge', () => {
  let page: any
  let mainFrame: any
  let bridge: WebKitCDPBridge
  let frameDetachedHandler: (frame: any) => void

  beforeEach(() => {
    mainFrame = { evaluate: vi.fn(async () => {}) }
    page = {
      exposeBinding: vi.fn(async () => {}),
      mainFrame: vi.fn(() => mainFrame),
      on: vi.fn((event, handler) => {
        if (event === 'framedetached') frameDetachedHandler = handler
      }),
    }

    bridge = new WebKitCDPBridge(page)
  })

  it('resolves Runtime.enable without side effects', async () => {
    await bridge.send('Runtime.enable')

    expect(page.exposeBinding).not.toHaveBeenCalled()
    expect(mainFrame.evaluate).not.toHaveBeenCalled()
  })

  it('throws on unknown commands', async () => {
    // @ts-expect-error intentionally invalid command
    await expect(bridge.send('Runtime.unknown')).rejects.toThrow('WebKitCDPBridge cannot handle command: Runtime.unknown')
  })

  describe('Runtime.addBinding', () => {
    it('exposes a page binding', async () => {
      await bridge.send('Runtime.addBinding', { name: 'binding-1' })

      expect(page.exposeBinding).toHaveBeenCalledWith('binding-1', expect.any(Function))
    })

    it('treats repeat registrations as a no-op like CDP', async () => {
      await bridge.send('Runtime.addBinding', { name: 'binding-1' })
      await bridge.send('Runtime.addBinding', { name: 'binding-1' })

      expect(page.exposeBinding).toHaveBeenCalledOnce()
    })

    it('emits Runtime.bindingCalled with a stable executionContextId per frame', async () => {
      await bridge.send('Runtime.addBinding', { name: 'binding-1' })

      const bindingHandler = page.exposeBinding.mock.calls[0][1]
      const events: any[] = []

      bridge.on('Runtime.bindingCalled', (event) => events.push(event))

      const frameA = {}
      const frameB = {}

      bindingHandler({ frame: frameA }, 'payload-1')
      bindingHandler({ frame: frameB }, 'payload-2')
      bindingHandler({ frame: frameA }, 'payload-3')

      expect(events).toEqual([
        { name: 'binding-1', payload: 'payload-1', executionContextId: 1 },
        { name: 'binding-1', payload: 'payload-2', executionContextId: 2 },
        { name: 'binding-1', payload: 'payload-3', executionContextId: 1 },
      ])
    })
  })

  describe('Runtime.evaluate', () => {
    it('wraps the expression in an IIFE and evaluates in the main frame by default', async () => {
      await bridge.send('Runtime.evaluate', { expression: 'if (true) { doWork() }' })

      expect(mainFrame.evaluate).toHaveBeenCalledWith('(() => {if (true) { doWork() }})()')
    })

    it('evaluates in the frame that last called the binding for the given contextId', async () => {
      await bridge.send('Runtime.addBinding', { name: 'binding-1' })

      const bindingHandler = page.exposeBinding.mock.calls[0][1]
      const frame = { evaluate: vi.fn(async () => {}) }

      bindingHandler({ frame }, 'payload')

      await bridge.send('Runtime.evaluate', { expression: 'reply()', contextId: 1 })

      expect(frame.evaluate).toHaveBeenCalledWith('(() => {reply()})()')
      expect(mainFrame.evaluate).not.toHaveBeenCalled()
    })

    it('serializes evaluations in send order', async () => {
      const order: string[] = []
      let resolveFirst!: () => void

      mainFrame.evaluate = vi.fn()
      .mockImplementationOnce(() => {
        return new Promise<void>((resolve) => {
          resolveFirst = () => {
            order.push('first resolved')
            resolve()
          }
        })
      })
      .mockImplementationOnce(() => {
        order.push('second started')

        return Promise.resolve()
      })

      const first = bridge.send('Runtime.evaluate', { expression: 'one()' })
      const second = bridge.send('Runtime.evaluate', { expression: 'two()' })

      await new Promise((resolve) => setImmediate(resolve))
      expect(order).toEqual([])

      resolveFirst()
      await Promise.all([first, second])

      expect(order).toEqual(['first resolved', 'second started'])
    })

    it('advances past an evaluation that never settles', async () => {
      bridge = new WebKitCDPBridge(page, 10)

      let secondRan = false

      mainFrame.evaluate = vi.fn()
      .mockImplementationOnce(() => new Promise(() => {}))
      .mockImplementationOnce(() => {
        secondRan = true

        return Promise.resolve('ok')
      })

      bridge.send('Runtime.evaluate', { expression: 'stuck()' })

      await expect(bridge.send('Runtime.evaluate', { expression: 'two()' })).resolves.toBe('ok')
      expect(secondRan).toBe(true)
    })

    it('keeps messages behind a timed-out evaluation serialized', async () => {
      bridge = new WebKitCDPBridge(page, 50)

      const order: string[] = []

      mainFrame.evaluate = vi.fn()
      .mockImplementationOnce(() => new Promise(() => {}))
      .mockImplementationOnce(() => {
        order.push('second started')

        return new Promise((resolve) => {
          setTimeout(() => {
            order.push('second resolved')
            resolve('two')
          }, 10)
        })
      })
      .mockImplementationOnce(() => {
        order.push('third started')

        return Promise.resolve('three')
      })

      bridge.send('Runtime.evaluate', { expression: 'stuck()' })
      const second = bridge.send('Runtime.evaluate', { expression: 'two()' })
      const third = bridge.send('Runtime.evaluate', { expression: 'three()' })

      await Promise.all([second, third])

      // the third message waits for the second to settle (its own turn) rather
      // than sharing the stuck evaluation's deadline and firing concurrently
      expect(order).toEqual(['second started', 'second resolved', 'third started'])
    })

    it('keeps evaluating after a failed evaluation', async () => {
      mainFrame.evaluate = vi.fn()
      .mockRejectedValueOnce(new Error('Execution context was destroyed'))
      .mockResolvedValueOnce('ok')

      await expect(bridge.send('Runtime.evaluate', { expression: 'one()' })).rejects.toThrow('Execution context was destroyed')
      await expect(bridge.send('Runtime.evaluate', { expression: 'two()' })).resolves.toBe('ok')
    })

    it('falls back to the main frame for a detached frame\'s contextId', async () => {
      await bridge.send('Runtime.addBinding', { name: 'binding-1' })

      const bindingHandler = page.exposeBinding.mock.calls[0][1]
      const frame = { evaluate: vi.fn(async () => {}) }

      bindingHandler({ frame }, 'payload')
      frameDetachedHandler(frame)

      await bridge.send('Runtime.evaluate', { expression: 'reply()', contextId: 1 })

      expect(frame.evaluate).not.toHaveBeenCalled()
      expect(mainFrame.evaluate).toHaveBeenCalledWith('(() => {reply()})()')
    })
  })
})
