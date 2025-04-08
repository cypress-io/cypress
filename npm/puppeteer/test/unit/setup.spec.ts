import { expect, use } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import type { PuppeteerNode, Browser } from 'puppeteer-core'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import { MessageHandler } from '../../src/plugin/setup'
import { setup } from '../../src/plugin'
import * as activateMainTabExport from '../../src/plugin/activateMainTab'

use(chaiAsPromised)
use(sinonChai)

type StubbedMessageHandler = sinon.SinonStub<Parameters<MessageHandler>, ReturnType<MessageHandler>>

describe('#setup', () => {
  let mockBrowser: Partial<Browser>
  let mockPuppeteer: Pick<PuppeteerNode, 'connect'>
  let on: sinon.SinonStub
  let onMessage: Record<string, StubbedMessageHandler>

  const testTask = 'test'
  let testTaskHandler: StubbedMessageHandler

  function getTask () {
    return on.withArgs('task').lastCall.args[1].__cypressPuppeteer__
  }

  function simulateBrowserLaunch () {
    return on.withArgs('after:browser:launch').yield({ family: 'chromium', isHeaded: true }, { webSocketDebuggerUrl: 'ws://debugger' })
  }

  beforeEach(() => {
    sinon.stub(activateMainTabExport, 'activateMainTab')
    mockBrowser = {
      disconnect: sinon.stub().resolves(),
    }

    mockPuppeteer = {
      connect: sinon.stub().resolves(mockBrowser),
    }

    on = sinon.stub()

    testTaskHandler = sinon.stub()

    onMessage = {
      [testTask]: testTaskHandler,
    }
  })

  afterEach(() => {
    sinon.reset()

    ;(activateMainTabExport.activateMainTab as sinon.SinonStub).restore()
  })

  it('registers `after:browser:launch` and `task` handlers', () => {
    setup({ on, onMessage })

    expect(on).to.be.calledWith('after:browser:launch')
    expect(on).to.be.calledWith('task')
  })

  it('errors if registering `after:browser:launch` fails', () => {
    const error = new Error('Event not registered')

    error.stack = '<error stack>'
    on.throws(error)

    expect(() => setup({ on, onMessage })).to.throw('Could not set up `after:browser:launch` task. Ensure you are running Cypress >= 13.6.0. The following error was encountered:\n\n<error stack>')
  })

  describe('running message handler', () => {
    it('connects puppeteer to browser', async () => {
      setup({
        on,
        puppeteer: mockPuppeteer as PuppeteerNode,
        onMessage,
      })

      simulateBrowserLaunch()

      const task = getTask()

      await task({ name: testTask, args: [] })

      expect(mockPuppeteer.connect).to.be.calledWith({
        browserWSEndpoint: 'ws://debugger',
        defaultViewport: null,
      })
    })

    it('calls the specified message handler with the browser and args', async () => {
      setup({
        on,
        puppeteer: mockPuppeteer as PuppeteerNode,
        onMessage,
      })

      simulateBrowserLaunch()

      const task = getTask()

      await task({ name: testTask, args: ['arg1', 'arg2'] })

      expect(testTaskHandler).to.be.calledWith(mockBrowser, 'arg1', 'arg2')
    })

    it('disconnects the browser once the message handler is finished', async () => {
      setup({
        on,
        puppeteer: mockPuppeteer as PuppeteerNode,
        onMessage,
      })

      simulateBrowserLaunch()

      const task = getTask()

      await task({ name: testTask, args: ['arg1', 'arg2'] })

      expect(mockBrowser.disconnect).to.be.called
    })

    it('returns the result of the handler', async () => {
      const resolution = 'result'

      onMessage[testTask].resolves(resolution)

      setup({
        on,
        puppeteer: mockPuppeteer as PuppeteerNode,
        onMessage,
      })

      simulateBrowserLaunch()

      const task = getTask()
      const returnValue = await task({ name: testTask, args: ['arg1', 'arg2'] })

      expect(returnValue).to.equal(resolution)
    })

    it('returns null if message handler returns undefined', async () => {
      onMessage[testTask].resolves(undefined)
      setup({
        on,
        puppeteer: mockPuppeteer as PuppeteerNode,
        onMessage,
      })

      simulateBrowserLaunch()

      const task = getTask()
      const returnValue = await task({ name: testTask, args: ['arg1', 'arg2'] })

      expect(returnValue).to.be.null
    })

    it('returns error object if debugger URL reference is lost', async () => {
      setup({ on, onMessage })

      const task = getTask()
      const returnValue = await task({ name: 'nonexistent', args: [] })

      expect(returnValue.__error__).to.be.an('object')
      expect(returnValue.__error__.message).to.equal(
        'Lost the reference to the browser. This usually occurs because the Cypress config was reloaded without the browser re-launching. Close and re-open the browser.',
      )
    })

    it('returns error object if browser is not supported', async () => {
      setup({ on, onMessage })

      on.withArgs('after:browser:launch').yield({ family: 'Firefox' }, {})

      const task = getTask()
      const returnValue = await task({ name: 'nonexistent', args: [] })

      expect(returnValue.__error__).to.be.an('object')
      expect(returnValue.__error__.message).to.equal(
        'Only browsers in the "Chromium" family are supported. You are currently running a browser with the family: Firefox',
      )
    })

    it('disconnects browser and returns error object if message handler errors', async () => {
      testTaskHandler.rejects(new Error('handler error'))
      setup({
        on,
        puppeteer: mockPuppeteer as PuppeteerNode,
        onMessage,
      })

      simulateBrowserLaunch()

      const task = getTask()
      const returnValue = await task({ name: testTask, args: ['arg1', 'arg2'] })

      expect(mockBrowser.disconnect).to.be.called
      expect(returnValue.__error__).to.be.an('object')
      expect(returnValue.__error__.message).to.equal('handler error')
    })

    it('returns error object if message handler with given name cannot be found', async () => {
      setup({ on, onMessage })

      simulateBrowserLaunch()

      const task = getTask()
      const returnValue = await task({ name: 'nonexistent', args: [] })

      expect(returnValue.__error__).to.be.an('object')
      expect(returnValue.__error__.message).to.equal(
        'Could not find message handler with the name `nonexistent`. Registered message handler names are: test.',
      )
    })

    it('returns error object if message handler with given name cannot be found', async () => {
      // @ts-expect-error
      setup({ on, onMessage: { notAFunction: true } })

      simulateBrowserLaunch()
      const task = getTask()
      const returnValue = await task({ name: 'notAFunction', args: [] })

      expect(returnValue.__error__).to.be.an('object')
      expect(returnValue.__error__.message).to.equal(
        'Message handlers must be functions, but the message handler for the name `notAFunction` was type `boolean`.',
      )
    })

    it('calls activateMainTab if there is a page in the browser', async () => {
      (activateMainTabExport.activateMainTab as sinon.SinonStub).withArgs(mockBrowser).resolves()
      setup({ on, onMessage, puppeteer: mockPuppeteer as PuppeteerNode })
      const task = getTask()

      simulateBrowserLaunch()
      await task({ name: testTask, args: [] })

      expect(activateMainTabExport.activateMainTab).to.be.calledWith(mockBrowser)
    })

    it('returns an error object if activateMainTab rejects', async () => {
      (activateMainTabExport.activateMainTab as sinon.SinonStub).withArgs(mockBrowser).rejects()

      setup({ on, onMessage, puppeteer: mockPuppeteer as PuppeteerNode })
      simulateBrowserLaunch()

      const task = getTask()

      const returnValue = await task({ name: testTask, args: [] })

      expect(returnValue.__error__).to.be.an('object')
      expect(returnValue.__error__.message).to.equal(
        'Cannot communicate with the Cypress Chrome extension. Ensure the extension is enabled when using the Puppeteer plugin.',
      )
    })

    it('does not try to activate main tab when the browser is headless', async () => {
      setup({ on, onMessage, puppeteer: mockPuppeteer as PuppeteerNode })
      on.withArgs('after:browser:launch').yield({ family: 'chromium', isHeaded: false }, { webSocketDebuggerUrl: 'ws://debugger' })
      const task = getTask()

      await task({ name: testTask, args: [] })

      expect(activateMainTabExport.activateMainTab).not.to.be.called
    })

    it('does not try to activate main tab when the browser is electron', async () => {
      setup({ on, onMessage, puppeteer: mockPuppeteer as PuppeteerNode })
      on.withArgs('after:browser:launch').yield({ family: 'chromium', isHeaded: true, name: 'electron' }, { webSocketDebuggerUrl: 'ws://debugger' })
      const task = getTask()

      await task({ name: testTask, args: [] })
      expect(activateMainTabExport.activateMainTab).not.to.be.called
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
