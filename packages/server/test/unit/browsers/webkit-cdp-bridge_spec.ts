import '../../spec_helper'
import { expect } from 'chai'
import sinon from 'sinon'
import { WebKitCDPBridge } from '../../../lib/browsers/webkit-cdp-bridge'

describe('lib/browsers/webkit-cdp-bridge', () => {
  let page: any
  let mainFrame: any
  let bridge: WebKitCDPBridge
  let frameNavigatedHandler: (frame: any) => void

  const navigateMainFrame = (url: string) => {
    mainFrame.url.returns(url)
    frameNavigatedHandler(mainFrame)
  }

  beforeEach(() => {
    mainFrame = { evaluate: sinon.stub().resolves(), url: sinon.stub().returns('about:blank') }
    page = {
      exposeBinding: sinon.stub().resolves(),
      mainFrame: sinon.stub().returns(mainFrame),
      on: sinon.stub().callsFake((event, handler) => {
        if (event === 'framenavigated') frameNavigatedHandler = handler
      }),
    }

    bridge = new WebKitCDPBridge(page)
  })

  it('reports the main frame as the root of the frame tree', async () => {
    await expect(bridge.send('Page.getFrameTree')).to.eventually.deep.equal({ frameTree: { frame: { id: 'main' }, childFrames: [] } })
  })

  context('execution contexts', () => {
    let created: any[]
    let destroyed: any[]

    beforeEach(() => {
      created = []
      destroyed = []
      bridge.on('Runtime.executionContextCreated', (event) => created.push(event.context))
      bridge.on('Runtime.executionContextDestroyed', (event) => destroyed.push(event.executionContextId))
    })

    it('reports the main frame\'s current context on Runtime.enable', async () => {
      mainFrame.url.returns('http://localhost:3500/__/')

      await bridge.send('Runtime.enable')
      await bridge.send('Runtime.enable')

      expect(created).to.deep.equal([
        { id: 1, origin: 'http://localhost:3500', name: '', uniqueId: '1', auxData: { frameId: 'main', isDefault: true } },
        { id: 1, origin: 'http://localhost:3500', name: '', uniqueId: '1', auxData: { frameId: 'main', isDefault: true } },
      ])

      expect(page.exposeBinding).not.to.be.called
      expect(mainFrame.evaluate).not.to.be.called
    })

    it('creates a new context when the main frame navigates to another origin', async () => {
      await bridge.send('Runtime.enable')

      navigateMainFrame('http://localhost:3500/__/')
      navigateMainFrame('http://localhost:3500/__/#/specs')
      navigateMainFrame('http://other.test/')

      expect(created.map(({ id, origin }) => ({ id, origin }))).to.deep.equal([
        { id: 1, origin: 'null' },
        { id: 2, origin: 'http://localhost:3500' },
        { id: 3, origin: 'http://other.test' },
      ])

      expect(destroyed).to.deep.equal([1, 2])
    })

    it('ignores child frame navigations', async () => {
      await bridge.send('Runtime.enable')

      frameNavigatedHandler({ url: () => 'http://other.test/' })

      expect(created).to.have.length(1)
    })
  })

  it('throws on unknown commands', async () => {
    // @ts-expect-error intentionally invalid command
    await expect(bridge.send('Runtime.unknown')).to.be.rejectedWith('WebKitCDPBridge cannot handle command: Runtime.unknown')
  })

  context('Runtime.addBinding', () => {
    it('exposes a page binding', async () => {
      await bridge.send('Runtime.addBinding', { name: 'binding-1' })

      expect(page.exposeBinding).to.be.calledWith('binding-1', sinon.match.func)
    })

    it('treats repeat registrations as a no-op like CDP', async () => {
      await bridge.send('Runtime.addBinding', { name: 'binding-1' })
      await bridge.send('Runtime.addBinding', { name: 'binding-1' })

      expect(page.exposeBinding).to.be.calledOnce
    })

    it('emits Runtime.bindingCalled with the main frame\'s current executionContextId', async () => {
      await bridge.send('Runtime.addBinding', { name: 'binding-1' })

      const bindingHandler = page.exposeBinding.firstCall.args[1]
      const events: any[] = []

      bridge.on('Runtime.bindingCalled', (event) => events.push(event))

      navigateMainFrame('http://localhost:3500/__/')
      bindingHandler({ frame: mainFrame }, 'payload-1')
      bindingHandler({ frame: mainFrame }, 'payload-2')
      navigateMainFrame('http://other.test/')
      bindingHandler({ frame: mainFrame }, 'payload-3')

      expect(events).to.deep.equal([
        { name: 'binding-1', payload: 'payload-1', executionContextId: 1 },
        { name: 'binding-1', payload: 'payload-2', executionContextId: 1 },
        { name: 'binding-1', payload: 'payload-3', executionContextId: 2 },
      ])
    })

    it('drops calls from child frames', async () => {
      await bridge.send('Runtime.addBinding', { name: 'binding-1' })

      const bindingHandler = page.exposeBinding.firstCall.args[1]
      const events: any[] = []

      bridge.on('Runtime.bindingCalled', (event) => events.push(event))
      bridge.on('Runtime.executionContextCreated', (event) => events.push(event))

      bindingHandler({ frame: { url: () => 'http://other.test/' } }, 'payload')

      expect(events).to.deep.equal([])
    })
  })

  context('Runtime.evaluate', () => {
    it('wraps the expression in an IIFE and evaluates in the main frame by default', async () => {
      await bridge.send('Runtime.evaluate', { expression: 'if (true) { doWork() }' })

      expect(mainFrame.evaluate).to.be.calledWith('(() => {if (true) { doWork() }})()')
    })

    it('evaluates in the main frame for its current contextId', async () => {
      mainFrame.url.returns('http://localhost:3500/__/')
      await bridge.send('Runtime.enable')

      await bridge.send('Runtime.evaluate', { expression: 'reply()', contextId: 1 })

      expect(mainFrame.evaluate).to.be.calledWith('(() => {reply()})()')
    })

    it('rejects a contextId left behind by a navigation to another origin', async () => {
      mainFrame.url.returns('http://localhost:3500/__/')
      await bridge.send('Runtime.enable')
      navigateMainFrame('http://other.test/')

      await expect(bridge.send('Runtime.evaluate', { expression: 'reply()', contextId: 1 })).to.be.rejectedWith('Cannot find context with specified id: 1')
      expect(mainFrame.evaluate).not.to.be.called
    })

    it('serializes evaluations in send order', async () => {
      const order: string[] = []
      let resolveFirst!: () => void

      mainFrame.evaluate = sinon.stub()
      .onFirstCall().callsFake(() => {
        return new Promise<void>((resolve) => {
          resolveFirst = () => {
            order.push('first resolved')
            resolve()
          }
        })
      })
      .onSecondCall().callsFake(() => {
        order.push('second started')

        return Promise.resolve()
      })

      const first = bridge.send('Runtime.evaluate', { expression: 'one()' })
      const second = bridge.send('Runtime.evaluate', { expression: 'two()' })

      await new Promise((resolve) => setImmediate(resolve))
      expect(order).to.be.empty

      resolveFirst()
      await Promise.all([first, second])

      expect(order).to.deep.equal(['first resolved', 'second started'])
    })

    it('advances past an evaluation that never settles', async () => {
      bridge = new WebKitCDPBridge(page, 10)

      let secondRan = false

      mainFrame.evaluate = sinon.stub()
      .onFirstCall().callsFake(() => new Promise(() => {}))
      .onSecondCall().callsFake(() => {
        secondRan = true

        return Promise.resolve('ok')
      })

      bridge.send('Runtime.evaluate', { expression: 'stuck()' })

      await expect(bridge.send('Runtime.evaluate', { expression: 'two()' })).to.eventually.equal('ok')
      expect(secondRan).to.be.true
    })

    it('keeps messages behind a timed-out evaluation serialized', async () => {
      bridge = new WebKitCDPBridge(page, 50)

      const order: string[] = []

      mainFrame.evaluate = sinon.stub()
      .onFirstCall().callsFake(() => new Promise(() => {}))
      .onSecondCall().callsFake(() => {
        order.push('second started')

        return new Promise((resolve) => {
          setTimeout(() => {
            order.push('second resolved')
            resolve('two')
          }, 10)
        })
      })
      .onThirdCall().callsFake(() => {
        order.push('third started')

        return Promise.resolve('three')
      })

      bridge.send('Runtime.evaluate', { expression: 'stuck()' })
      const second = bridge.send('Runtime.evaluate', { expression: 'two()' })
      const third = bridge.send('Runtime.evaluate', { expression: 'three()' })

      await Promise.all([second, third])

      // the third message waits for the second to settle (its own turn) rather
      // than sharing the stuck evaluation's deadline and firing concurrently
      expect(order).to.deep.equal(['second started', 'second resolved', 'third started'])
    })

    it('keeps evaluating after a failed evaluation', async () => {
      mainFrame.evaluate = sinon.stub()
      .onFirstCall().rejects(new Error('Execution context was destroyed'))
      .onSecondCall().resolves('ok')

      await expect(bridge.send('Runtime.evaluate', { expression: 'one()' })).to.be.rejectedWith('Execution context was destroyed')
      await expect(bridge.send('Runtime.evaluate', { expression: 'two()' })).to.eventually.equal('ok')
    })
  })
})
