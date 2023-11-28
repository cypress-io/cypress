import { expect, use } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import type { PuppeteerNode } from 'puppeteer-core'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'

import { setup } from '../../src/plugin'

use(chaiAsPromised)
use(sinonChai)

function getTask (on: sinon.SinonStub) {
  return on.withArgs('task').lastCall.args[1].__cypressPuppeteer__
}

describe('#setup', () => {
  it('registers `after:browser:launch` and `task` handlers', () => {
    const on = sinon.stub()

    setup({ on, onMessage: {} })

    expect(on).to.be.calledWith('after:browser:launch')
    expect(on).to.be.calledWith('task')
  })

  it('errors if registering `after:browser:launch` fails', () => {
    const error = new Error('Event not registered')

    error.stack = '<error stack>'
    const on = sinon.stub().throws(error)

    expect(() => setup({ on, onMessage: {} })).to.throw('Could not set up `after:browser:launch` task. Ensure you are running Cypress >= 13.6.0. The following error was encountered:\n\n<error stack>')
  })

  describe('running message handler', () => {
    it('connects puppeteer to browser', async () => {
      const on = sinon.stub()
      const puppeteer = {
        connect: sinon.stub().resolves({
          disconnect () {},
        }),
      }

      setup({
        on,
        puppeteer: puppeteer as unknown as PuppeteerNode,
        onMessage: { test: sinon.stub() },
      })

      on.withArgs('after:browser:launch').lastCall.args[1]({ family: 'chromium' }, { webSocketDebuggerUrl: 'ws://debugger' })

      const task = getTask(on)

      await task({ name: 'test', args: [] })

      expect(puppeteer.connect).to.be.calledWith({
        browserWSEndpoint: 'ws://debugger',
        defaultViewport: null,
      })
    })

    it('calls the specified message handler with the browser and args', async () => {
      const on = sinon.stub()
      const browser = { disconnect () {} }
      const puppeteer = {
        connect: sinon.stub().resolves(browser),
      }
      const handler = sinon.stub()

      setup({
        on,
        puppeteer: puppeteer as unknown as PuppeteerNode,
        onMessage: { test: handler },
      })

      on.withArgs('after:browser:launch').lastCall.args[1]({ family: 'chromium' }, { webSocketDebuggerUrl: 'ws://debugger' })

      const task = getTask(on)

      await task({ name: 'test', args: ['arg1', 'arg2'] })

      expect(handler).to.be.calledWith(browser, 'arg1', 'arg2')
    })

    it('disconnects the browser once the message handler is finished', async () => {
      const on = sinon.stub()
      const browser = { disconnect: sinon.stub() }
      const puppeteer = {
        connect: sinon.stub().resolves(browser),
      }
      const handler = sinon.stub()

      setup({
        on,
        puppeteer: puppeteer as unknown as PuppeteerNode,
        onMessage: { test: handler },
      })

      on.withArgs('after:browser:launch').lastCall.args[1]({ family: 'chromium' }, { webSocketDebuggerUrl: 'ws://debugger' })

      const task = getTask(on)

      await task({ name: 'test', args: ['arg1', 'arg2'] })

      expect(browser.disconnect).to.be.called
    })

    it('returns the result of the handler', async () => {
      const on = sinon.stub()
      const browser = { disconnect: sinon.stub() }
      const puppeteer = {
        connect: sinon.stub().resolves(browser),
      }
      const handler = sinon.stub().resolves('result')

      setup({
        on,
        puppeteer: puppeteer as unknown as PuppeteerNode,
        onMessage: { test: handler },
      })

      on.withArgs('after:browser:launch').lastCall.args[1]({ family: 'chromium' }, { webSocketDebuggerUrl: 'ws://debugger' })

      const task = getTask(on)
      const returnValue = await task({ name: 'test', args: ['arg1', 'arg2'] })

      expect(returnValue).to.equal('result')
    })

    it('returns null if message handler returns undefined', async () => {
      const on = sinon.stub()
      const browser = { disconnect: sinon.stub() }
      const puppeteer = {
        connect: sinon.stub().resolves(browser),
      }
      const handler = sinon.stub().resolves(undefined)

      setup({
        on,
        puppeteer: puppeteer as unknown as PuppeteerNode,
        onMessage: { test: handler },
      })

      on.withArgs('after:browser:launch').lastCall.args[1]({ family: 'chromium' }, { webSocketDebuggerUrl: 'ws://debugger' })

      const task = getTask(on)
      const returnValue = await task({ name: 'test', args: ['arg1', 'arg2'] })

      expect(returnValue).to.be.null
    })

    it('returns error object if debugger URL reference is lost', async () => {
      const on = sinon.stub()

      setup({ on, onMessage: {
        exists1: () => {},
        exists2: () => {},
      } })

      const task = getTask(on)
      const returnValue = await task({ name: 'nonexistent', args: [] })

      expect(returnValue.__error__).to.be.an('object')
      expect(returnValue.__error__.message).to.equal(
        'Lost the reference to the browser. This usually occurs because the Cypress config was reloaded without the browser re-launching. Close and re-open the browser.',
      )
    })

    it('returns error object if browser is not supported', async () => {
      const on = sinon.stub()

      setup({ on, onMessage: {
        exists1: () => {},
        exists2: () => {},
      } })

      on.withArgs('after:browser:launch').lastCall.args[1]({ family: 'Firefox' }, {})

      const task = getTask(on)
      const returnValue = await task({ name: 'nonexistent', args: [] })

      expect(returnValue.__error__).to.be.an('object')
      expect(returnValue.__error__.message).to.equal(
        'Only browsers in the "Chromium" family are supported. You are currently running a browser with the family: Firefox',
      )
    })

    it('disconnects browser and returns error object if message handler errors', async () => {
      const on = sinon.stub()
      const browser = { disconnect: sinon.stub() }
      const puppeteer = {
        connect: sinon.stub().resolves(browser),
      }
      const handler = sinon.stub().rejects(new Error('handler error'))

      setup({
        on,
        puppeteer: puppeteer as unknown as PuppeteerNode,
        onMessage: { test: handler },
      })

      on.withArgs('after:browser:launch').lastCall.args[1]({ family: 'chromium' }, { webSocketDebuggerUrl: 'ws://debugger' })

      const task = getTask(on)
      const returnValue = await task({ name: 'test', args: ['arg1', 'arg2'] })

      expect(browser.disconnect).to.be.called
      expect(returnValue.__error__).to.be.an('object')
      expect(returnValue.__error__.message).to.equal('handler error')
    })

    it('returns error object if message handler with given name cannot be found', async () => {
      const on = sinon.stub()

      setup({ on, onMessage: {
        exists1: () => {},
        exists2: () => {},
      } })

      on.withArgs('after:browser:launch').lastCall.args[1]({ family: 'chromium' }, { webSocketDebuggerUrl: 'ws://debugger' })

      const task = getTask(on)
      const returnValue = await task({ name: 'nonexistent', args: [] })

      expect(returnValue.__error__).to.be.an('object')
      expect(returnValue.__error__.message).to.equal(
        'Could not find message handler with the name `nonexistent`. Registered message handler names are: exists1, exists2.',
      )
    })

    it('returns error object if message handler with given name cannot be found', async () => {
      const on = sinon.stub()

      // @ts-expect-error
      setup({ on, onMessage: { notAFunction: true } })

      on.withArgs('after:browser:launch').lastCall.args[1]({ family: 'chromium' }, { webSocketDebuggerUrl: 'ws://debugger' })

      const task = getTask(on)
      const returnValue = await task({ name: 'notAFunction', args: [] })

      expect(returnValue.__error__).to.be.an('object')
      expect(returnValue.__error__.message).to.equal(
        'Message handlers must be functions, but the message handler for the name `notAFunction` was type `boolean`.',
      )
    })
  })

  describe('validation', () => {
    it('errors if options argument is not provided', () => {
      // @ts-expect-error
      expect(() => setup()).to.throw('Must provide options argument to `setup`.')
    })

    it('errors if options argument is not an object', () => {
      // @ts-expect-error
      expect(() => setup(true)).to.throw('The options argument provided to `setup` must be an object.')
    })

    it('errors if `on` option is not provided', () => {
      // @ts-expect-error
      expect(() => setup({})).to.throw('Must provide `on` function to `setup`.')
    })

    it('errors if `on` option is not a function', () => {
      // @ts-expect-error
      expect(() => setup({ on: 'string' })).to.throw('The `on` option provided to `setup` must be a function.')
    })

    it('errors if `onMessage` option is not provided', () => {
      // @ts-expect-error
      expect(() => setup({ on: sinon.stub() })).to.throw('Must provide `onMessage` object to `setup`.')
    })

    it('errors if `onMessage` option is not an object', () => {
      // @ts-expect-error
      expect(() => setup({ on: sinon.stub(), onMessage: () => {} })).to.throw('The `onMessage` option provided to `setup` must be an object.')
    })
  })
})
