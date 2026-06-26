import '../../spec_helper'
import { expect } from 'chai'
import { WebKitAutomation } from '../../../lib/browsers/webkit-automation'
import type { RunModeVideoApi } from '@packages/types'

// builds a minimal mock of the Playwright objects WebKitAutomation interacts with
function createMockBrowser () {
  let lastContext: any
  let lastPage: any

  const makeContextAndPage = () => {
    // by default, expose a single AUT child frame off of the main frame
    const autFrame: any = {
      name: () => `Your project: 'some-project'`,
      url: () => 'http://localhost:3000/index.html',
      title: sinon.stub().resolves('My App'),
      childFrames: () => [],
    }

    const mainFrame: any = {
      childFrames: () => [autFrame],
    }

    const page: any = {
      context: () => context,
      mainFrame: () => mainFrame,
      addInitScript: sinon.stub().resolves(),
      on: sinon.stub(),
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
      pages: () => [page],
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

describe('lib/browsers/webkit-automation', () => {
  let automation: any
  let mock: ReturnType<typeof createMockBrowser>
  let videoApi: RunModeVideoApi
  let capturedController: any

  beforeEach(() => {
    automation = { use: sinon.stub(), onDownloadLinkClicked: sinon.stub() }
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

  const createAutomation = (opts: Partial<{ videoApi: RunModeVideoApi, isHeadless: boolean }> = { videoApi }) => {
    return WebKitAutomation.create({
      automation,
      browser: mock.browser as any,
      initialUrl: 'http://localhost/__cypress',
      downloadsFolder: '/tmp/downloads',
      videoApi: opts.videoApi,
      isHeadless: opts.isHeadless ?? true,
    })
  }

  context('devicePixelRatio', () => {
    // https://github.com/cypress-io/cypress/issues/23808
    // Headless WebKit forces a standard devicePixelRatio so screenshots are
    // consistent regardless of host DPI, mirroring headless Chrome. Headed
    // WebKit keeps the host's native DPR (also matching Chrome).
    it('forces deviceScaleFactor to 1 when headless', async () => {
      await createAutomation({ isHeadless: true })

      expect(mock.browser.newContext).to.be.called
      expect(mock.browser.newContext.firstCall.args[0]).to.include({ deviceScaleFactor: 1 })
    })

    it('does not set deviceScaleFactor when headed', async () => {
      await createAutomation({ isHeadless: false })

      expect(mock.browser.newContext).to.be.called
      expect(mock.browser.newContext.firstCall.args[0]).not.to.have.property('deviceScaleFactor')
    })
  })

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

  context('focus:browser:window', () => {
    it('brings the active page to the front', async () => {
      const wk = await createAutomation()

      await wk.onRequest('focus:browser:window', {})

      expect(mock.getLastPage().bringToFront).to.be.calledOnce
    })

    it('resolves without error when there are no open pages', async () => {
      const wk = await createAutomation()

      mock.getLastContext().pages = () => []

      await wk.onRequest('focus:browser:window', {})
    })
  })

  context('get:aut:url / get:aut:title', () => {
    it('returns the AUT frame url for get:aut:url', async () => {
      const wk = await createAutomation()

      const url = await wk.onRequest('get:aut:url', {})

      expect(url).to.eq('http://localhost:3000/index.html')
    })

    it('returns the AUT frame title for get:aut:title', async () => {
      const wk = await createAutomation()

      const title = await wk.onRequest('get:aut:title', {})

      expect(title).to.eq('My App')
    })

    it('falls back to the first child frame when the AUT frame cannot be identified by name', async () => {
      const wk = await createAutomation()

      const firstChild: any = {
        name: () => '',
        url: () => 'http://localhost:3000/fallback.html',
        title: sinon.stub().resolves('Fallback'),
        childFrames: () => [],
      }

      mock.getLastPage().mainFrame = () => ({ childFrames: () => [firstChild] })

      expect(await wk.onRequest('get:aut:url', {})).to.eq('http://localhost:3000/fallback.html')
      expect(await wk.onRequest('get:aut:title', {})).to.eq('Fallback')
    })

    it('throws when no AUT frame can be found', async () => {
      const wk = await createAutomation()

      mock.getLastPage().mainFrame = () => ({ childFrames: () => [] })

      let error: Error | undefined

      try {
        await wk.onRequest('get:aut:url', {})
      } catch (err) {
        error = err
      }

      expect(error?.message).to.include('Could not find AUT frame')
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
})
