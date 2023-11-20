import { expect, use } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import type { PuppeteerNode } from 'puppeteer-core'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'

import { setup } from '../../src'

use(chaiAsPromised)
use(sinonChai)

function getTask (on: sinon.SinonStub) {
  return on.withArgs('task').lastCall.args[1].__cypressPuppeteer__
}

describe('#setup', () => {
  it('registers `after:browser:launch` and `task` handlers', () => {
    const on = sinon.stub()

    setup({ on, callbacks: {} })

    expect(on).to.be.calledWith('after:browser:launch')
    expect(on).to.be.calledWith('task')
  })

  it('errors if registering `after:browser:launch` fails', () => {
    const error = new Error('Event not registered')

    error.stack = '<error stack>'
    const on = sinon.stub().throws(error)

    expect(() => setup({ on, callbacks: {} })).to.throw('@cypress/puppeteer: Could not set up `after:browser:launch` task. Ensure you are running a version of Cypress that supports it. The following error was encountered:\n\n<error stack>')
  })

  describe('running callback', () => {
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
        callbacks: { test: sinon.stub() },
      })

      on.withArgs('after:browser:launch').lastCall.args[1](null, { webSocketDebuggerUrl: 'ws://debugger' })

      const task = getTask(on)

      await task({ name: 'test', args: [] })

      expect(puppeteer.connect).to.be.calledWith({
        browserWSEndpoint: 'ws://debugger',
        defaultViewport: null,
      })
    })

    it('calls the specified callback with the browser and args', async () => {
      const on = sinon.stub()
      const browser = { disconnect () {} }
      const puppeteer = {
        connect: sinon.stub().resolves(browser),
      }
      const callback = sinon.stub()

      setup({
        on,
        puppeteer: puppeteer as unknown as PuppeteerNode,
        callbacks: { test: callback },
      })

      on.withArgs('after:browser:launch').lastCall.args[1](null, { webSocketDebuggerUrl: 'ws://debugger' })

      const task = getTask(on)

      await task({ name: 'test', args: ['arg1', 'arg2'] })

      expect(callback).to.be.calledWith(browser, 'arg1', 'arg2')
    })

    it('disconnects the browser once the callback is finished', async () => {
      const on = sinon.stub()
      const browser = { disconnect: sinon.stub() }
      const puppeteer = {
        connect: sinon.stub().resolves(browser),
      }
      const callback = sinon.stub()

      setup({
        on,
        puppeteer: puppeteer as unknown as PuppeteerNode,
        callbacks: { test: callback },
      })

      on.withArgs('after:browser:launch').lastCall.args[1](null, { webSocketDebuggerUrl: 'ws://debugger' })

      const task = getTask(on)

      await task({ name: 'test', args: ['arg1', 'arg2'] })

      expect(browser.disconnect).to.be.called
    })

    it('returns the result of the callback', async () => {
      const on = sinon.stub()
      const browser = { disconnect: sinon.stub() }
      const puppeteer = {
        connect: sinon.stub().resolves(browser),
      }
      const callback = sinon.stub().resolves('result')

      setup({
        on,
        puppeteer: puppeteer as unknown as PuppeteerNode,
        callbacks: { test: callback },
      })

      on.withArgs('after:browser:launch').lastCall.args[1](null, { webSocketDebuggerUrl: 'ws://debugger' })

      const task = getTask(on)
      const returnValue = await task({ name: 'test', args: ['arg1', 'arg2'] })

      expect(returnValue).to.equal('result')
    })

    it('returns null if callback returns undefined', async () => {
      const on = sinon.stub()
      const browser = { disconnect: sinon.stub() }
      const puppeteer = {
        connect: sinon.stub().resolves(browser),
      }
      const callback = sinon.stub().resolves(undefined)

      setup({
        on,
        puppeteer: puppeteer as unknown as PuppeteerNode,
        callbacks: { test: callback },
      })

      on.withArgs('after:browser:launch').lastCall.args[1](null, { webSocketDebuggerUrl: 'ws://debugger' })

      const task = getTask(on)
      const returnValue = await task({ name: 'test', args: ['arg1', 'arg2'] })

      expect(returnValue).to.be.null
    })

    it('disconnects browser and returns error object if callback errors', async () => {
      const on = sinon.stub()
      const browser = { disconnect: sinon.stub() }
      const puppeteer = {
        connect: sinon.stub().resolves(browser),
      }
      const callback = sinon.stub().rejects(new Error('callback error'))

      setup({
        on,
        puppeteer: puppeteer as unknown as PuppeteerNode,
        callbacks: { test: callback },
      })

      on.withArgs('after:browser:launch').lastCall.args[1](null, { webSocketDebuggerUrl: 'ws://debugger' })

      const task = getTask(on)
      const returnValue = await task({ name: 'test', args: ['arg1', 'arg2'] })

      expect(browser.disconnect).to.be.called
      expect(returnValue.__error__).to.be.an('Error')
      expect(returnValue.__error__.message).to.equal('callback error')
    })

    it('returns error object if callback with given name cannot be found', async () => {
      const on = sinon.stub()

      setup({ on, callbacks: {
        exists1: () => {},
        exists2: () => {},
      } })

      const task = getTask(on)
      const returnValue = await task({ name: 'nonexistent', args: [] })

      expect(returnValue.__error__).to.be.an('Error')
      expect(returnValue.__error__.message).to.equal(
        '@cypress/puppeteer: Could not find callback with the name `nonexistent`. Registered callback names are: exists1, exists2.',
      )
    })

    it('returns error object if callback with given name cannot be found', async () => {
      const on = sinon.stub()

      // @ts-expect-error
      setup({ on, callbacks: { notAFunction: true } })

      const task = getTask(on)
      const returnValue = await task({ name: 'notAFunction', args: [] })

      expect(returnValue.__error__).to.be.an('Error')
      expect(returnValue.__error__.message).to.equal(
        '@cypress/puppeteer: Callbacks must be a function, but the callback for the name `notAFunction` was type `boolean`.',
      )
    })
  })

  describe('validation', () => {
    it('errors if options argument is not provided', () => {
      // @ts-expect-error
      expect(() => setup()).to.throw('@cypress/puppeteer: Must provide options argument to `setup`.')
    })

    it('errors if options argument is not an object', () => {
      // @ts-expect-error
      expect(() => setup(true)).to.throw('@cypress/puppeteer: The options argument provided to `setup` must be an object.')
    })

    it('errors if `on` option is not provided', () => {
      // @ts-expect-error
      expect(() => setup({})).to.throw('@cypress/puppeteer: Must provide `on` function to `setup`.')
    })

    it('errors if `on` option is not a function', () => {
      // @ts-expect-error
      expect(() => setup({ on: 'string' })).to.throw('@cypress/puppeteer: The `on` option provided to `setup` must be a function.')
    })

    it('errors if `callbacks` option is not provided', () => {
      // @ts-expect-error
      expect(() => setup({ on: sinon.stub() })).to.throw('@cypress/puppeteer: Must provide `callbacks` object to `setup`.')
    })

    it('errors if `callbacks` option is not an object', () => {
      // @ts-expect-error
      expect(() => setup({ on: sinon.stub(), callbacks: () => {} })).to.throw('@cypress/puppeteer: The `callbacks` option provided to `setup` must be an object.')
    })
  })
})
