import { proxyquire } from '../../spec_helper'
import { expect } from 'chai'

// load webkit-automation with its heavy imports stubbed out so the test only
// exercises the playwright request-event handling
function getWebKitAutomation () {
  return proxyquire('../lib/browsers/webkit-automation', {
    './utils': {
      __esModule: true,
      default: { listenForDownload () {} },
      '@noCallThru': true,
    },
    './cdp_automation': {
      normalizeResourceType: (type: string) => type,
      '@noCallThru': true,
    },
    '../automation/util': {
      cookieMatches: () => false,
      '@noCallThru': true,
    },
  }).WebKitAutomation as typeof import('../../../lib/browsers/webkit-automation').WebKitAutomation
}

// builds a minimal playwright Request stub that satisfies the fields read by
// handleRequestEvents' 'request' handler
function makeRequest (url: string) {
  return {
    url: () => url,
    method: () => 'GET',
    headers: () => ({}),
    resourceType: () => 'fetch',
    frame: () => ({ url: () => url }),
    timing: () => ({ requestStart: 0 }),
    response: undefined as any,
  }
}

describe('lib/browsers/webkit-automation', () => {
  context('request events', () => {
    let automation
    let handlers: Record<string, Function>

    beforeEach(async () => {
      automation = {
        use: sinon.stub(),
        onBrowserPreRequest: sinon.stub(),
        onRequestEvent: sinon.stub(),
        onRemoveBrowserPreRequest: sinon.stub(),
      }

      handlers = {}

      const context = {
        exposeBinding: sinon.stub().resolves(),
        route: sinon.stub().resolves(),
        newPage: undefined as any,
      }

      const page = {
        on: sinon.stub().callsFake((event: string, handler: Function) => {
          handlers[event] = handler
        }),
        addInitScript: sinon.stub().resolves(),
        context: () => context,
      }

      context.newPage = sinon.stub().resolves(page)

      const browser = { newContext: sinon.stub().resolves(context) }

      const WebKitAutomation = getWebKitAutomation()

      await WebKitAutomation.create({
        automation,
        browser: browser as any,
        initialUrl: undefined as any,
        downloadsFolder: undefined as any,
      })
    })

    it('registers request, requestfinished, and requestfailed handlers', () => {
      expect(handlers).to.have.keys('request', 'requestfinished', 'requestfailed')
    })

    it('emits a browserPreRequest for each request', () => {
      handlers.request(makeRequest('http://example.com/a'))

      expect(automation.onBrowserPreRequest).to.be.calledOnce
      expect(automation.onBrowserPreRequest.lastCall.args[0]).to.include({
        method: 'GET',
        url: 'http://example.com/a',
      })
    })

    it('ignores cypress internal requests', () => {
      handlers.request(makeRequest('http://localhost:1234/__cypress/foo'))
      handlers.request(makeRequest('http://localhost:1234/__socket'))

      expect(automation.onBrowserPreRequest).not.to.be.called
    })

    it('removes the pre-request when a request fails', () => {
      const request = makeRequest('http://example.com/fail')

      handlers.request(request)
      const { requestId } = automation.onBrowserPreRequest.lastCall.args[0]

      handlers.requestfailed(request)

      expect(automation.onRemoveBrowserPreRequest).to.be.calledOnceWith(requestId)
    })

    it('does nothing on requestfailed for an unknown request', () => {
      // a request that never went through the 'request' handler has no mapped id
      handlers.requestfailed(makeRequest('http://example.com/unknown'))

      expect(automation.onRemoveBrowserPreRequest).not.to.be.called
    })

    it('removes the pre-request for service-worker-fulfilled responses', async () => {
      const request = makeRequest('http://example.com/sw')

      handlers.request(request)
      const { requestId } = automation.onBrowserPreRequest.lastCall.args[0]

      request.response = sinon.stub().resolves({
        fromServiceWorker: () => true,
        status: () => 200,
        allHeaders: sinon.stub().resolves({}),
      })

      await handlers.requestfinished(request)

      expect(automation.onRemoveBrowserPreRequest).to.be.calledOnceWith(requestId)
      expect(automation.onRequestEvent).not.to.be.called
    })

    it('emits response:received for normal finished responses', async () => {
      const request = makeRequest('http://example.com/ok')

      handlers.request(request)
      const { requestId } = automation.onBrowserPreRequest.lastCall.args[0]

      request.response = sinon.stub().resolves({
        fromServiceWorker: () => false,
        status: () => 200,
        allHeaders: sinon.stub().resolves({ 'content-type': 'text/html' }),
      })

      await handlers.requestfinished(request)

      expect(automation.onRequestEvent).to.be.calledOnceWith('response:received', {
        requestId,
        status: 200,
        headers: { 'content-type': 'text/html' },
      })

      expect(automation.onRemoveBrowserPreRequest).not.to.be.called
    })
  })
})
