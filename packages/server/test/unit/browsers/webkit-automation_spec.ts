import '../../spec_helper'
import { expect } from 'chai'
import { WebKitAutomation } from '../../../lib/browsers/webkit-automation'
import type { RunModeVideoApi } from '@packages/types'

// builds a minimal mock of the Playwright objects WebKitAutomation interacts with
function createMockBrowser () {
  let lastContext: any
  let lastPage: any

  const makeContextAndPage = () => {
    const page: any = {
      context: () => context,
      addInitScript: sinon.stub().resolves(),
      // capture registered event handlers so tests can invoke them directly
      _handlers: {} as Record<string, Function>,
      on: sinon.stub().callsFake((event: string, handler: Function) => {
        page._handlers[event] = handler
      }),
      video: sinon.stub(),
      close: sinon.stub().resolves(),
      goto: sinon.stub().resolves(),
      screenshot: sinon.stub().resolves(Buffer.from('')),
      bringToFront: sinon.stub().resolves(),
    }

    const context: any = {
      newPage: sinon.stub().resolves(page),
      exposeBinding: sinon.stub().resolves(),
      route: sinon.stub().resolves(),
      cookies: sinon.stub().resolves([]),
      clearCookies: sinon.stub().resolves(),
      addCookies: sinon.stub().resolves(),
      browser: () => browser,
      close: sinon.stub().resolves(),
    }

    lastContext = context
    lastPage = page

    return context
  }

  const browser: any = {
    newContext: sinon.stub().callsFake(async () => makeContextAndPage()),
    close: sinon.stub().resolves(),
  }

  return {
    browser,
    getLastContext: () => lastContext,
    getLastPage: () => lastPage,
  }
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
  let automation: any
  let mock: ReturnType<typeof createMockBrowser>
  let videoApi: RunModeVideoApi
  let capturedController: any

  beforeEach(() => {
    automation = {
      use: sinon.stub(),
      onDownloadLinkClicked: sinon.stub(),
      onBrowserPreRequest: sinon.stub(),
      onRequestEvent: sinon.stub(),
      onRemoveBrowserPreRequest: sinon.stub(),
    }

    mock = createMockBrowser()
    capturedController = undefined

    videoApi = {
      useVideoController: sinon.stub().callsFake((controller) => {
        capturedController = controller
      }),
      videoName: '/tmp/videos/spec.mp4',
      compressedVideoName: '/tmp/videos/spec-compressed.mp4',
      onError: sinon.stub(),
    } as unknown as RunModeVideoApi
  })

  const createAutomation = (opts: Partial<{ videoApi: RunModeVideoApi }> = { videoApi }) => {
    return WebKitAutomation.create({
      automation,
      browser: mock.browser as any,
      initialUrl: 'http://localhost/__cypress',
      downloadsFolder: '/tmp/downloads',
      videoApi: opts.videoApi,
    })
  }

  context('video recording', () => {
    it('registers a video controller that cannot be restarted', async () => {
      await createAutomation()

      expect(capturedController, 'a video controller should be registered').to.exist

      let error: Error | undefined

      try {
        await capturedController.restart()
      } catch (err) {
        error = err
      }

      // WebKit cannot record video across specs on the same page, so restart must not silently
      // succeed - the run loop relies on this to recreate the tab per spec instead (see #23815).
      expect(error?.message).to.include('Cannot restart WebKit video')
    })

    it('endVideoCapture closes the page and saves the video to the spec video path', async () => {
      await createAutomation()

      const pwVideo = { saveAs: sinon.stub().resolves() }

      mock.getLastPage().video.returns(pwVideo)

      await capturedController.endVideoCapture()

      expect(mock.getLastPage().close, 'page should be closed to flush the video').to.be.called
      expect(pwVideo.saveAs).to.be.calledWith(videoApi.videoName)
    })
  })

  context('reset:browser:tabs:for:next:spec', () => {
    it('closes the browser when the tab should not be kept open', async () => {
      const wk = await createAutomation()

      await wk.onRequest('reset:browser:tabs:for:next:spec', { shouldKeepTabOpen: false })

      expect(mock.browser.close).to.be.calledOnce
    })

    it('recreates the context/page when the tab should be kept open', async () => {
      const wk = await createAutomation()

      const newContextCallsBefore = mock.browser.newContext.callCount
      const previousContext = mock.getLastContext()

      await wk.onRequest('reset:browser:tabs:for:next:spec', { shouldKeepTabOpen: true })

      // a fresh context + page is created for the next spec, and the previous context is torn down
      expect(mock.browser.newContext.callCount).to.eq(newContextCallsBefore + 1)
      expect(previousContext.close).to.be.called
    })
  })

  context('request events', () => {
    let handlers: Record<string, Function>

    beforeEach(async () => {
      await createAutomation()
      handlers = mock.getLastPage()._handlers
    })

    it('registers request, requestfinished, and requestfailed handlers', () => {
      expect(handlers).to.include.keys('request', 'requestfinished', 'requestfailed')
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
