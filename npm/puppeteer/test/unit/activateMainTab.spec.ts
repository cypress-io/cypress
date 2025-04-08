import { expect, use } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import type { Browser, Page } from 'puppeteer-core'
import { activateMainTab, ACTIVATION_TIMEOUT } from '../../src/plugin/activateMainTab'

use(chaiAsPromised)
use(sinonChai)

describe('activateMainTab', () => {
  let clock: sinon.SinonFakeTimers
  let prevWin: Window
  let prevDoc: Document
  let prevTop: Window & typeof globalThis
  let window: Partial<Window>
  let mockDocument: Partial<Document> & {
    defaultView: Window & typeof globalThis
  }
  let mockTop: Partial<Window & typeof globalThis>
  let mockBrowser: Partial<Browser>
  let mockPage: Partial<Page>

  beforeEach(() => {
    clock = sinon.useFakeTimers()

    window = {
      addEventListener: sinon.stub(),
      removeEventListener: sinon.stub(),

      // @ts-ignore sinon gets confused about postMessage type declaration
      postMessage: sinon.stub(),
    }

    mockDocument = {
      defaultView: window as Window & typeof globalThis,
    }

    mockTop = mockDocument.defaultView

    // activateMainTab is eval'd in browser context, but the tests exec in a
    // node context. We don't necessarily need to do this swap, but it makes the
    // tests more portable.
    // @ts-ignore
    prevWin = global.window
    prevDoc = global.document
    // @ts-ignore
    prevTop = global.top
    //@ts-ignore
    global.window = window
    global.document = mockDocument as Document
    //@ts-ignore
    global.top = mockTop

    mockPage = {
      evaluate: sinon.stub().callsFake((fn, ...args) => fn(...args)),
    }

    mockBrowser = {
      pages: sinon.stub(),
    }
  })

  afterEach(() => {
    clock.restore()
    // @ts-ignore
    global.window = prevWin
    // @ts-ignore
    global.top = prevTop
    global.document = prevDoc
  })

  it('sends a tab activation request to the plugin, and resolves when the ack event is received', async () => {
    const pagePromise = Promise.resolve([mockPage])

    ;(mockBrowser.pages as sinon.SinonStub).returns(pagePromise)
    const p = activateMainTab(mockBrowser as Browser)

    await pagePromise
    // @ts-ignore
    window.addEventListener.withArgs('message').yield({ data: { message: 'cypress:extension:main:tab:activated' } })
    expect(window.postMessage).to.be.calledWith({ message: 'cypress:extension:activate:main:tab' })

    expect(p).to.eventually.be.true
  })

  it('sends a tab activation request to the plugin, and rejects if it times out', async () => {
    const pagePromise = Promise.resolve([mockPage])

    ;(mockBrowser.pages as sinon.SinonStub).returns(pagePromise)
    await pagePromise

    const p = activateMainTab(mockBrowser as Browser)

    clock.tick(ACTIVATION_TIMEOUT + 1)

    expect(p).to.be.rejected
  })

  describe('when cy in cy', () => {
    beforeEach(() => {
      mockDocument.defaultView = {} as Window & typeof globalThis
    })

    it('does not try to send tab activation message', async () => {
      const pagePromise = Promise.resolve([mockPage])

      ;(mockBrowser.pages as sinon.SinonStub).returns(pagePromise)

      const p = activateMainTab(mockBrowser as Browser)

      await pagePromise
      expect(window.postMessage).not.to.be.called
      expect(window.addEventListener).not.to.be.called
      await p
    })
  })
})
