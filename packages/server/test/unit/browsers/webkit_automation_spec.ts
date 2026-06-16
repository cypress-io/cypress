import { expect } from 'chai'
import sinon from 'sinon'
import { WebKitAutomation } from '../../../lib/browsers/webkit-automation'

// Builds a minimal Playwright-like request object for exercising the
// page request-lifecycle handlers registered in `handleRequestEvents`.
function makePwRequest (url = 'https://www.foobar.com/foo') {
  return {
    url: () => url,
    method: () => 'GET',
    headers: () => ({}),
    resourceType: () => 'fetch',
    frame: () => ({ url: () => 'https://example.com' }),
    timing: () => ({ requestStart: 0 }),
  }
}

// Shape of the WebKitAutomation instance fields the tests need to reach.
// Scoped narrowly so a rename of `page` or `handleRequestEvents` is caught
// by the type checker rather than silently passing.
interface WebKitAutomationInternals {
  page: { on: (event: string, cb: (request: any) => void) => void }
  handleRequestEvents (): void
}

// The real constructor is private (entry point is the async `create()` factory,
// which needs a live Playwright browser). Cast the class to a plain constructor
// so we can build a bare instance and exercise the handlers in isolation.
const WebKitAutomationCtor = WebKitAutomation as unknown as new (opts: {
  automation: unknown
  browser: unknown
}) => WebKitAutomationInternals

describe('lib/browsers/webkit-automation', () => {
  context('#handleRequestEvents', () => {
    let automation
    let handlers: Record<string, (request: any) => void>
    let page

    beforeEach(() => {
      handlers = {}
      page = {
        on: (event: string, cb: (request: any) => void) => {
          handlers[event] = cb
        },
      }

      automation = {
        onBrowserPreRequest: sinon.stub(),
        onRequestEvent: sinon.stub(),
        onRemoveBrowserPreRequest: sinon.stub(),
      }

      const wkAutomation = new WebKitAutomationCtor({ automation, browser: {} })

      wkAutomation.page = page
      wkAutomation.handleRequestEvents()
    })

    afterEach(() => {
      sinon.restore()
    })

    it('registers request, requestfinished, and requestfailed handlers', () => {
      expect(handlers).to.have.keys('request', 'requestfinished', 'requestfailed')
    })

    // https://github.com/cypress-io/cypress/issues/23810
    // forceNetworkError / req.destroy() resets the connection, producing a
    // failed request whose pre-request must be removed to avoid leaking it in
    // the proxy's pre-request queue (which caused infinite request loops).
    it('removes the orphaned pre-request when a request fails', () => {
      const request = makePwRequest()

      // first the pre-request is emitted, assigning + caching a requestId
      handlers.request(request)

      expect(automation.onBrowserPreRequest).to.have.been.calledOnce
      const { requestId } = automation.onBrowserPreRequest.getCall(0).args[0]

      // then the request fails (e.g. due to forceNetworkError)
      handlers.requestfailed(request)

      expect(automation.onRemoveBrowserPreRequest).to.have.been.calledOnceWith(requestId)
    })

    it('ignores requestfailed for a request that never emitted a pre-request', () => {
      // a request with no mapped id (e.g. a filtered /__cypress request) is a no-op
      handlers.requestfailed(makePwRequest('https://www.foobar.com/bar'))

      expect(automation.onRemoveBrowserPreRequest).not.to.have.been.called
    })
  })
})
