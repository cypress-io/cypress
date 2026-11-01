import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'
import { WebKitAutomation } from '../../../lib/browsers/webkit-automation'
import { WebKitCDPBridge } from '../../../lib/browsers/webkit-cdp-bridge'
import { SYNC_XHR_PATCH } from '../../../lib/automation/commands/remote_sync_xhr'
import type { RunModeVideoApi } from '@packages/types'
import { REPORTER_FRAME_NAME, AUT_SNAPSHOT_FRAME_NAME_IDENTIFIER, SPEC_FRAME_NAME_IDENTIFIER } from '@packages/types'

// sinon's calledBefore: the first call of `first` precedes the last call of `second`
const expectCalledBefore = (first: Mock, second: Mock) => {
  expect(first).toHaveBeenCalled()
  expect(second).toHaveBeenCalled()
  expect(first.mock.invocationCallOrder[0]).toBeLessThan(second.mock.invocationCallOrder.at(-1)!)
}

// builds a minimal mock of the Playwright objects WebKitAutomation interacts with
function createMockBrowser () {
  let lastContext: any
  let lastPage: any

  const makeContextAndPage = () => {
    // by default, expose a single AUT child frame off of the main frame
    const autFrame: any = {
      name: () => `Your project: 'some-project'`,
      url: () => 'http://localhost:3000/index.html',
      title: vi.fn(async () => 'My App'),
      evaluate: vi.fn(async () => undefined),
      childFrames: () => [],
    }

    const mainFrame: any = {
      childFrames: () => [autFrame],
    }

    const page: any = {
      context: () => context,
      mainFrame: () => mainFrame,
      addInitScript: vi.fn(async () => {}),
      on: vi.fn(),
      video: vi.fn(),
      close: vi.fn(async () => {}),
      goto: vi.fn(async () => {}),
      screenshot: vi.fn(async () => Buffer.from('')),
      bringToFront: vi.fn(async () => {}),
    }

    const context: any = {
      newPage: vi.fn(async () => page),
      exposeBinding: vi.fn(async () => {}),
      route: vi.fn(async () => {}),
      cookies: vi.fn(async () => []),
      clearCookies: vi.fn(async () => {}),
      addCookies: vi.fn(async () => {}),
      browser: () => browser,
      close: vi.fn(async () => {}),
      pages: () => [page],
    }

    lastContext = context
    lastPage = page

    return context
  }

  const browser: any = {
    newContext: vi.fn(async () => makeContextAndPage()),
    close: vi.fn(async () => {}),
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
    automation = { use: vi.fn(), onDownloadLinkClicked: vi.fn() }
    mock = createMockBrowser()
    capturedController = undefined

    videoApi = {
      useVideoController: vi.fn((controller) => {
        capturedController = controller
      }),
      videoName: '/tmp/videos/spec.mp4',
      compressedVideoName: '/tmp/videos/spec-compressed.mp4',
      onError: vi.fn(),
    } as unknown as RunModeVideoApi
  })

  const createAutomation = (opts: Partial<{ videoApi: RunModeVideoApi, userAgent: string, isHeadless: boolean, cdpSocketServer: any, remoteDriver: boolean }> = { videoApi }) => {
    return WebKitAutomation.create({
      automation,
      browser: mock.browser as any,
      initialUrl: 'http://localhost/__cypress',
      downloadsFolder: '/tmp/downloads',
      videoApi: opts.videoApi,
      userAgent: opts.userAgent,
      isHeadless: opts.isHeadless ?? true,
      cdpSocketServer: opts.cdpSocketServer,
      remoteDriver: opts.remoteDriver,
    })
  }

  describe('automation socket', () => {
    it('attaches a bridge for the new page before navigating', async () => {
      const cdpSocketServer = { attachCDPClient: vi.fn(async () => {}) }

      await createAutomation({ cdpSocketServer })

      expect(cdpSocketServer.attachCDPClient).toHaveBeenCalledWith(expect.any(WebKitCDPBridge))
      // the bridge's window bindings must exist before the runner loads and connects
      expectCalledBefore(cdpSocketServer.attachCDPClient, mock.getLastPage().goto)
    })
  })

  describe('devicePixelRatio', () => {
    // https://github.com/cypress-io/cypress/issues/23808
    // Headless WebKit forces a standard devicePixelRatio so screenshots are
    // consistent regardless of host DPI, mirroring headless Chrome. Headed
    // WebKit keeps the host's native DPR (also matching Chrome).
    it('forces deviceScaleFactor to 1 when headless', async () => {
      await createAutomation({ isHeadless: true })

      expect(mock.browser.newContext).toHaveBeenCalled()
      expect(mock.browser.newContext.mock.calls[0][0]).toMatchObject({ deviceScaleFactor: 1 })
    })

    it('does not set deviceScaleFactor when headed', async () => {
      await createAutomation({ isHeadless: false })

      expect(mock.browser.newContext).toHaveBeenCalled()
      expect(mock.browser.newContext.mock.calls[0][0]).not.toHaveProperty('deviceScaleFactor')
    })
  })

  describe('video recording', () => {
    it('registers a video controller that cannot be restarted', async () => {
      await createAutomation()

      expect(capturedController, 'a video controller should be registered').toEqual(expect.anything())

      let error: Error | undefined

      try {
        await capturedController.restart()
      } catch (err) {
        error = err
      }

      // WebKit cannot record video across specs on the same page, so restart must not silently
      // succeed - the run loop relies on this to recreate the tab per spec instead (see #23815).
      expect(error?.message).toContain('Cannot restart WebKit video')
    })

    it('endVideoCapture closes the page and saves the video to the spec video path', async () => {
      await createAutomation()

      const pwVideo = { saveAs: vi.fn(async () => {}) }

      mock.getLastPage().video.mockReturnValue(pwVideo)

      await capturedController.endVideoCapture()

      expect(mock.getLastPage().close, 'page should be closed to flush the video').toHaveBeenCalled()
      expect(pwVideo.saveAs).toHaveBeenCalledWith(videoApi.videoName)
    })
  })

  describe('userAgent', () => {
    it('passes the configured userAgent to every context it creates', async () => {
      const userAgent = 'Mozilla/5.0 (custom) Cypress'

      const wk = await createAutomation({ userAgent })

      expect(mock.browser.newContext).toHaveBeenCalledWith(expect.objectContaining({ userAgent }))

      // the userAgent should persist when the tab is recycled for the next spec (see #33349)
      await wk.onRequest('reset:browser:tabs:for:next:spec', { shouldKeepTabOpen: true })

      expect(mock.browser.newContext.mock.lastCall[0]).toMatchObject({ userAgent })
    })

    it('does not set a userAgent when none is configured', async () => {
      await createAutomation({})

      expect(mock.browser.newContext).toHaveBeenCalledOnce()
      expect(mock.browser.newContext.mock.calls[0][0]).not.toHaveProperty('userAgent')
    })
  })

  describe('focus:browser:window', () => {
    it('brings the active page to the front', async () => {
      const wk = await createAutomation()

      await wk.onRequest('focus:browser:window', {})

      expect(mock.getLastPage().bringToFront).toHaveBeenCalledOnce()
    })

    it('resolves without error when there are no open pages', async () => {
      const wk = await createAutomation()

      mock.getLastContext().pages = () => []

      await wk.onRequest('focus:browser:window', {})
    })
  })

  describe('AUT request marking', () => {
    const getRouteHandler = () => mock.getLastContext().route.mock.calls[0][1]

    it('marks requests for the AUT iframe', async () => {
      await createAutomation()

      const route = { continue: vi.fn() }
      const runnerFrame = { parentFrame: () => null }
      const request = {
        resourceType: () => 'document',
        url: () => 'http://localhost:3000/index.html',
        headers: () => ({ accept: 'text/html' }),
        frame: () => ({ parentFrame: () => runnerFrame }),
      }

      await getRouteHandler()(route, request)

      expect(route.continue).toHaveBeenCalledWith({ headers: { 'accept': 'text/html', 'X-Cypress-Is-AUT-Frame': 'true' } })
    })

    it('lets a new tab\'s first navigation through, though its frame does not exist yet', async () => {
      await createAutomation()

      const route = { continue: vi.fn() }
      const request = {
        resourceType: () => 'document',
        url: () => 'http://localhost:3000/help.html',
        headers: () => ({}),
        frame: () => {
          throw new Error('Frame for this navigation request is not available')
        },
      }

      await getRouteHandler()(route, request)

      expect(route.continue).toHaveBeenCalledWith()
    })
  })

  describe('AUT errors', () => {
    const onConsoleMessage = vi.fn()
    const onConsoleRepeatCountUpdated = vi.fn()
    let delegate: any

    const error = (overrides: object = {}) => {
      return { message: { source: 'javascript', level: 'error', text: 'Error: app boom', url: 'http://www.foobar.com/', ...overrides } }
    }

    beforeEach(async () => {
      delegate = { _onConsoleMessage: onConsoleMessage, _onConsoleRepeatCountUpdated: onConsoleRepeatCountUpdated }
      automation.push = vi.fn(async () => {})

      const newContext = mock.browser.newContext.getMockImplementation()

      mock.browser.newContext.mockImplementationOnce(async () => {
        const context = await newContext()
        const page = mock.getLastPage()

        page.url = () => 'http://cypress-runner.foobar.com/__/'
        // the in-process Playwright client reaches its server page through the connection
        page._connection = { toImpl: () => ({ delegate }) }

        return context
      })

      await createAutomation()
    })

    it('pushes an error from the AUT and each repeat of it, and keeps Playwright\'s handling', async () => {
      delegate._onConsoleMessage(error())
      delegate._onConsoleRepeatCountUpdated({ count: 2 })
      await new Promise((resolve) => setImmediate(resolve))

      expect(automation.push).toHaveBeenCalledTimes(2)
      expect(automation.push).toHaveBeenCalledWith('remote:uncaught:exception', { handlerType: 'error', error: { name: 'Error', message: 'app boom', stack: undefined } })
      expect(onConsoleMessage).toHaveBeenCalledWith(error())
      expect(onConsoleRepeatCountUpdated).toHaveBeenCalledWith({ count: 2 })
    })

    it('ignores the runner\'s errors, rejections with no location, and repeats of other messages', async () => {
      delegate._onConsoleMessage(error({ url: 'http://cypress-runner.foobar.com/__cypress/runner.js' }))
      delegate._onConsoleMessage(error({ text: 'Unhandled Promise Rejection: Error: nope', url: '' }))
      delegate._onConsoleMessage(error({ level: 'log' }))
      delegate._onConsoleRepeatCountUpdated({ count: 2 })
      await new Promise((resolve) => setImmediate(resolve))

      expect(automation.push).not.toHaveBeenCalled()
    })
  })

  describe('remote driver dialogs and stubs', () => {
    const listenersFor = (event: string) => mock.getLastPage().on.mock.calls.filter(([name]) => name === event).map(([, listener]) => listener)
    const bindingFor = (name: string) => mock.getLastContext().exposeBinding.mock.calls.find(([bindingName]) => bindingName === name)?.[1]

    beforeEach(() => {
      automation.push = vi.fn(async () => {})
    })

    it('leaves dialogs to Playwright and exposes no binding without the remote driver', async () => {
      await createAutomation()

      expect(listenersFor('dialog')).toHaveLength(0)
      expect(bindingFor('__cypressRemoteStubCall')).toBeUndefined()
    })

    it('answers a dialog, then reports it', async () => {
      await createAutomation({ remoteDriver: true })

      const dialog = { type: () => 'confirm', message: () => 'sure?', accept: vi.fn(async () => {}), dismiss: vi.fn(async () => {}) }

      await listenersFor('dialog')[0](dialog)

      expect(dialog.accept).toHaveBeenCalledOnce()
      expect(automation.push).toHaveBeenCalledWith('remote:dialog', { type: 'confirm', message: 'sure?', accepted: true })
    })

    it('pushes a stub call from the AUT frame only', async () => {
      await createAutomation({ remoteDriver: true })

      const binding = bindingFor('__cypressRemoteStubCall')
      const autFrame = mock.getLastPage().mainFrame().childFrames()[0]

      await binding({ frame: autFrame }, '{"id":"stub-1","args":[]}')
      await binding({ frame: mock.getLastPage().mainFrame() }, '{"id":"stub-1","args":[1]}')

      expect(automation.push).toHaveBeenCalledExactlyOnceWith('remote:stub:call', { id: 'stub-1', args: [] })
    })
  })

  it('marks synchronous XHRs in the AUT with the remote driver only', async () => {
    await createAutomation()
    expect(mock.getLastPage().addInitScript).not.toHaveBeenCalledWith({ content: SYNC_XHR_PATCH })

    await createAutomation({ remoteDriver: true })
    expect(mock.getLastPage().addInitScript).toHaveBeenCalledWith({ content: SYNC_XHR_PATCH })
  })

  describe('remote driver navigation', () => {
    const listenersFor = (event: string) => mock.getLastPage().on.mock.calls.filter(([name]) => name === event).map(([, listener]) => listener)
    // the navigation listeners are added after the network ones
    const emit = (event: string, arg: unknown) => listenersFor(event).at(-1)(arg)
    const navigationRequest = (frame: unknown, status = 200) => ({ isNavigationRequest: () => true, frame: () => frame, response: async () => ({ status: () => status }) })
    const navigations = () => vi.mocked(automation.push).mock.calls.filter(([message]) => message === 'remote:navigation').map(([, data]) => data)

    let autFrame: any

    beforeEach(async () => {
      automation.push = vi.fn(async () => {})
      await createAutomation({ remoteDriver: true })
      autFrame = mock.getLastPage().mainFrame().childFrames()[0]
      autFrame.waitForLoadState = vi.fn(async () => {})
    })

    it('pushes a document load of the AUT frame, ending it once the frame loads', async () => {
      await emit('request', navigationRequest(mock.getLastPage().mainFrame()))
      await emit('request', navigationRequest(autFrame))
      await emit('framenavigated', autFrame)
      await new Promise((resolve) => setImmediate(resolve))

      expect(autFrame.waitForLoadState).toHaveBeenCalledWith('load')
      expect(navigations()).toEqual([{ event: 'started' }, { event: 'stopped' }])
    })

    it('ends a navigation that leaves the document in place', async () => {
      const noContent = navigationRequest(autFrame, 204)

      await emit('request', noContent)
      await emit('requestfinished', noContent)

      expect(navigations()).toEqual([{ event: 'started' }, { event: 'stopped' }])
    })

    it('takes a frame navigation with no request in flight as a URL change within the document', async () => {
      const urls = ['http://localhost:3000/index.html', 'http://localhost:3000/index.html#a', 'http://localhost:3000/b']

      autFrame.url = () => urls.shift()

      await emit('framenavigated', autFrame)
      await emit('framenavigated', autFrame)
      await emit('framenavigated', autFrame)

      expect(navigations()).toEqual([
        { event: 'withinDocument', source: 'history' },
        { event: 'withinDocument', source: 'hashchange' },
        { event: 'withinDocument', source: 'history' },
      ])
    })
  })

  describe('tabs the app opened', () => {
    const makePage = (url: string) => {
      return {
        url: () => url,
        close: vi.fn(async () => {}),
        mainFrame: () => ({}),
      }
    }

    it('closes every page but the runner\'s', async () => {
      const wk = await createAutomation()
      const runner = mock.getLastPage()
      const popup = makePage('http://login.idp.test/popup')

      mock.getLastContext().pages = () => [runner, popup]
      await wk.closeExtraPages()

      expect(popup.close).toHaveBeenCalled()
      expect(runner.close).not.toHaveBeenCalled()
    })

    it('fails a call in a matching tab clearly when WebKit was not launched in-process', async () => {
      const wk = await createAutomation()
      const popup = makePage('http://login.idp.test/popup')

      mock.getLastContext().pages = () => [mock.getLastPage(), popup]

      await expect(wk.onRequest('remote:agent', { method: 'click', context: {}, args: {}, tab: { url: 'idp' } })).rejects.toThrow('could not reach Playwright\'s isolated world')
    })
  })

  describe('reload:aut:frame / navigate:aut:history', () => {
    it('reloads the AUT frame', async () => {
      const wk = await createAutomation()

      await wk.onRequest('reload:aut:frame', { forceReload: true })

      expect(mock.getLastPage().mainFrame().childFrames()[0].evaluate).toHaveBeenCalledWith('window.location.reload(true)')
    })

    it('navigates the AUT frame history', async () => {
      const wk = await createAutomation()

      await wk.onRequest('navigate:aut:history', { historyNumber: -1 })

      expect(mock.getLastPage().mainFrame().childFrames()[0].evaluate).toHaveBeenCalledWith('window.history.go(-1)')
    })
  })

  describe('get:aut:url / get:aut:title', () => {
    it('returns the AUT frame url for get:aut:url', async () => {
      const wk = await createAutomation()

      const url = await wk.onRequest('get:aut:url', {})

      expect(url).toBe('http://localhost:3000/index.html')
    })

    it('returns the AUT frame title for get:aut:title', async () => {
      const wk = await createAutomation()

      const title = await wk.onRequest('get:aut:title', {})

      expect(title).toBe('My App')
    })

    it('falls back to the first child frame when the AUT frame cannot be identified by name', async () => {
      const wk = await createAutomation()

      const firstChild: any = {
        name: () => '',
        url: () => 'http://localhost:3000/fallback.html',
        title: vi.fn(async () => 'Fallback'),
        childFrames: () => [],
      }

      mock.getLastPage().mainFrame = () => ({ childFrames: () => [firstChild] })

      expect(await wk.onRequest('get:aut:url', {})).toBe('http://localhost:3000/fallback.html')
      expect(await wk.onRequest('get:aut:title', {})).toBe('Fallback')
    })

    const runnerFrame = (name: string): any => {
      return {
        name: () => name,
        url: () => 'about:blank',
        title: vi.fn(async () => ''),
        childFrames: () => [],
      }
    }

    it('falls back to the only child frame the runner does not own', async () => {
      const wk = await createAutomation()

      const aut: any = {
        name: () => '',
        url: () => 'http://localhost:3000/fallback.html',
        title: vi.fn(async () => 'Fallback'),
        childFrames: () => [],
      }

      mock.getLastPage().mainFrame = () => {
        return {
          childFrames: () => {
            return [
              runnerFrame(REPORTER_FRAME_NAME),
              aut,
              runnerFrame(`${AUT_SNAPSHOT_FRAME_NAME_IDENTIFIER} - 0: 'some-project'`),
              runnerFrame(`${SPEC_FRAME_NAME_IDENTIFIER}: '/__cypress/iframes/spec.js'`),
            ]
          },
        }
      }

      expect(await wk.onRequest('get:aut:url', {})).toBe('http://localhost:3000/fallback.html')
      expect(await wk.onRequest('get:aut:title', {})).toBe('Fallback')
    })

    it('fails rather than picking a runner frame when the AUT frame is gone', async () => {
      const wk = await createAutomation()

      mock.getLastPage().mainFrame = () => {
        return {
          childFrames: () => {
            return [
              runnerFrame(REPORTER_FRAME_NAME),
              runnerFrame(`${AUT_SNAPSHOT_FRAME_NAME_IDENTIFIER} - 0: 'some-project'`),
              runnerFrame(`${SPEC_FRAME_NAME_IDENTIFIER}: '/__cypress/iframes/spec.js'`),
            ]
          },
        }
      }

      let error: Error | undefined

      try {
        await wk.onRequest('get:aut:url', {})
      } catch (err) {
        error = err
      }

      expect(error?.message).toContain('Could not find AUT frame')
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

      expect(error?.message).toContain('Could not find AUT frame')
    })
  })

  describe('reset:browser:tabs:for:next:spec', () => {
    it('closes the browser when the tab should not be kept open', async () => {
      const wk = await createAutomation()

      await wk.onRequest('reset:browser:tabs:for:next:spec', { shouldKeepTabOpen: false })

      expect(mock.browser.close).toHaveBeenCalledOnce()
    })

    it('recreates the context/page when the tab should be kept open', async () => {
      const wk = await createAutomation()

      const newContextCallsBefore = mock.browser.newContext.mock.calls.length
      const previousContext = mock.getLastContext()

      await wk.onRequest('reset:browser:tabs:for:next:spec', { shouldKeepTabOpen: true })

      // a fresh context + page is created for the next spec, and the previous context is torn down
      expect(mock.browser.newContext).toHaveBeenCalledTimes(newContextCallsBefore + 1)
      expect(previousContext.close).toHaveBeenCalled()
    })
  })
})
