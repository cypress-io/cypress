import '../../spec_helper'
import { expect } from 'chai'
import sinon from 'sinon'
import { WebKitCDPBridge } from '../../../lib/browsers/webkit-cdp-bridge'

describe('lib/browsers/webkit-cdp-bridge', () => {
  let page: any
  let mainFrame: any
  let bridge: WebKitCDPBridge
  let frameDetachedHandler: (frame: any) => void

  beforeEach(() => {
    mainFrame = { evaluate: sinon.stub().resolves() }
    page = {
      exposeBinding: sinon.stub().resolves(),
      mainFrame: sinon.stub().returns(mainFrame),
      on: sinon.stub().callsFake((event, handler) => {
        if (event === 'framedetached') frameDetachedHandler = handler
      }),
    }

    bridge = new WebKitCDPBridge(page)
  })

  it('resolves Runtime.enable without side effects', async () => {
    await bridge.send('Runtime.enable')

    expect(page.exposeBinding).not.to.be.called
    expect(mainFrame.evaluate).not.to.be.called
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

    it('emits Runtime.bindingCalled with a stable executionContextId per frame', async () => {
      await bridge.send('Runtime.addBinding', { name: 'binding-1' })

      const bindingHandler = page.exposeBinding.firstCall.args[1]
      const events: any[] = []

      bridge.on('Runtime.bindingCalled', (event) => events.push(event))

      const frameA = {}
      const frameB = {}

      bindingHandler({ frame: frameA }, 'payload-1')
      bindingHandler({ frame: frameB }, 'payload-2')
      bindingHandler({ frame: frameA }, 'payload-3')

      expect(events).to.deep.equal([
        { name: 'binding-1', payload: 'payload-1', executionContextId: 1 },
        { name: 'binding-1', payload: 'payload-2', executionContextId: 2 },
        { name: 'binding-1', payload: 'payload-3', executionContextId: 1 },
      ])
    })
  })

  context('Runtime.evaluate', () => {
    it('wraps the expression in an IIFE and evaluates in the main frame by default', async () => {
      await bridge.send('Runtime.evaluate', { expression: 'if (true) { doWork() }' })

      expect(mainFrame.evaluate).to.be.calledWith('(() => {if (true) { doWork() }})()')
    })

    it('evaluates in the frame that last called the binding for the given contextId', async () => {
      await bridge.send('Runtime.addBinding', { name: 'binding-1' })

      const bindingHandler = page.exposeBinding.firstCall.args[1]
      const frame = { evaluate: sinon.stub().resolves() }

      bindingHandler({ frame }, 'payload')

      await bridge.send('Runtime.evaluate', { expression: 'reply()', contextId: 1 })

      expect(frame.evaluate).to.be.calledWith('(() => {reply()})()')
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

    it('falls back to the main frame for a detached frame\'s contextId', async () => {
      await bridge.send('Runtime.addBinding', { name: 'binding-1' })

      const bindingHandler = page.exposeBinding.firstCall.args[1]
      const frame = { evaluate: sinon.stub().resolves() }

      bindingHandler({ frame }, 'payload')
      frameDetachedHandler(frame)

      await bridge.send('Runtime.evaluate', { expression: 'reply()', contextId: 1 })

      expect(frame.evaluate).not.to.be.called
      expect(mainFrame.evaluate).to.be.calledWith('(() => {reply()})()')
    })
  })
})
