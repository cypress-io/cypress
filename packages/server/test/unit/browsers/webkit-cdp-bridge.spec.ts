import { beforeEach, describe, expect, it, vi } from 'vitest'
import { WebKitCDPBridge } from '../../../lib/browsers/webkit-cdp-bridge'

describe('lib/browsers/webkit-cdp-bridge', () => {
  let page: any
  let mainFrame: any
  let bridge: WebKitCDPBridge
  let frameNavigatedHandler: (frame: any) => void

  const navigateMainFrame = (url: string) => {
    mainFrame.url.mockReturnValue(url)
    frameNavigatedHandler(mainFrame)
  }

  beforeEach(() => {
    mainFrame = { evaluate: vi.fn(async () => {}), url: vi.fn(() => 'about:blank') }
    page = {
      exposeBinding: vi.fn(async () => {}),
      mainFrame: vi.fn(() => mainFrame),
      on: vi.fn((event, handler) => {
        if (event === 'framenavigated') frameNavigatedHandler = handler
      }),
    }

    bridge = new WebKitCDPBridge(page)
  })

  it('reports the main frame as the root of the frame tree', async () => {
    await expect(bridge.send('Page.getFrameTree')).resolves.toStrictEqual({ frameTree: { frame: { id: 'main' }, childFrames: [] } })
  })

  describe('execution contexts', () => {
    let created: any[]
    let destroyed: any[]

    beforeEach(() => {
      created = []
      destroyed = []
      bridge.on('Runtime.executionContextCreated', (event) => created.push(event.context))
      bridge.on('Runtime.executionContextDestroyed', (event) => destroyed.push(event.executionContextId))
    })

    it('reports the main frame\'s current context on Runtime.enable', async () => {
      mainFrame.url.mockReturnValue('http://localhost:3500/__/')

      await bridge.send('Runtime.enable')
      await bridge.send('Runtime.enable')

      expect(created).toStrictEqual([
        { id: 1, origin: 'http://localhost:3500', name: '', uniqueId: '1', auxData: { frameId: 'main', isDefault: true } },
        { id: 1, origin: 'http://localhost:3500', name: '', uniqueId: '1', auxData: { frameId: 'main', isDefault: true } },
      ])

      expect(page.exposeBinding).not.toHaveBeenCalled()
      expect(mainFrame.evaluate).not.toHaveBeenCalled()
    })

    it('creates a new context when the main frame navigates to another origin', async () => {
      await bridge.send('Runtime.enable')

      navigateMainFrame('http://localhost:3500/__/')
      navigateMainFrame('http://localhost:3500/__/#/specs')
      navigateMainFrame('http://other.test/')

      expect(created.map(({ id, origin }) => ({ id, origin }))).toStrictEqual([
        { id: 1, origin: 'null' },
        { id: 2, origin: 'http://localhost:3500' },
        { id: 3, origin: 'http://other.test' },
      ])

      expect(destroyed).toStrictEqual([1, 2])
    })

    it('ignores child frame navigations', async () => {
      await bridge.send('Runtime.enable')

      frameNavigatedHandler({ url: () => 'http://other.test/' })

      expect(created).toHaveLength(1)
    })
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

    it('emits Runtime.bindingCalled with the main frame\'s current executionContextId', async () => {
      await bridge.send('Runtime.addBinding', { name: 'binding-1' })

      const bindingHandler = page.exposeBinding.mock.calls[0][1]
      const events: any[] = []

      bridge.on('Runtime.bindingCalled', (event) => events.push(event))

      navigateMainFrame('http://localhost:3500/__/')
      bindingHandler({ frame: mainFrame }, 'payload-1')
      bindingHandler({ frame: mainFrame }, 'payload-2')
      navigateMainFrame('http://other.test/')
      bindingHandler({ frame: mainFrame }, 'payload-3')

      expect(events).toStrictEqual([
        { name: 'binding-1', payload: 'payload-1', executionContextId: 1 },
        { name: 'binding-1', payload: 'payload-2', executionContextId: 1 },
        { name: 'binding-1', payload: 'payload-3', executionContextId: 2 },
      ])
    })

    it('drops calls from child frames', async () => {
      await bridge.send('Runtime.addBinding', { name: 'binding-1' })

      const bindingHandler = page.exposeBinding.mock.calls[0][1]
      const events: any[] = []

      bridge.on('Runtime.bindingCalled', (event) => events.push(event))
      bridge.on('Runtime.executionContextCreated', (event) => events.push(event))

      bindingHandler({ frame: { url: () => 'http://other.test/' } }, 'payload')

      expect(events).toStrictEqual([])
    })
  })

  describe('Runtime.evaluate', () => {
    it('wraps the expression in an IIFE and evaluates in the main frame by default', async () => {
      await bridge.send('Runtime.evaluate', { expression: 'if (true) { doWork() }' })

      expect(mainFrame.evaluate).toHaveBeenCalledWith('(() => {if (true) { doWork() }})()')
    })

    it('evaluates in the main frame for its current contextId', async () => {
      mainFrame.url.mockReturnValue('http://localhost:3500/__/')
      await bridge.send('Runtime.enable')

      await bridge.send('Runtime.evaluate', { expression: 'reply()', contextId: 1 })

      expect(mainFrame.evaluate).toHaveBeenCalledWith('(() => {reply()})()')
    })

    it('rejects a contextId left behind by a navigation to another origin', async () => {
      mainFrame.url.mockReturnValue('http://localhost:3500/__/')
      await bridge.send('Runtime.enable')
      navigateMainFrame('http://other.test/')

      await expect(bridge.send('Runtime.evaluate', { expression: 'reply()', contextId: 1 })).rejects.toThrow('Cannot find context with specified id: 1')
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
      expect(order).toStrictEqual([])

      resolveFirst()
      await Promise.all([first, second])

      expect(order).toStrictEqual(['first resolved', 'second started'])
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
      expect(order).toStrictEqual(['second started', 'second resolved', 'third started'])
    })

    it('keeps evaluating after a failed evaluation', async () => {
      mainFrame.evaluate = vi.fn()
      .mockRejectedValueOnce(new Error('Execution context was destroyed'))
      .mockResolvedValueOnce('ok')

      await expect(bridge.send('Runtime.evaluate', { expression: 'one()' })).rejects.toThrow('Execution context was destroyed')
      await expect(bridge.send('Runtime.evaluate', { expression: 'two()' })).resolves.toBe('ok')
    })
  })
})
