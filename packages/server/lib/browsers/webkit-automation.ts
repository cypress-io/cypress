import Debug from 'debug'
import type playwright from 'playwright-webkit'
import type { Automation } from '../automation'
import { normalizeResourceType } from './cdp-protocol/normalize-resource-type'
import os from 'os'
import type { RemoteAutScriptConfig, RemoteNavigation, RunModeVideoApi } from '@packages/types'
import path from 'path'
import mime from 'mime'
import { cookieMatches } from '../automation/cookie/util'
import { convertPlaywrightCookieToCyCookie, convertCyCookieToPlaywrightCookie } from '../automation/cookie/converters/webkit'
import utils from './utils'
import type { CyCookie, CyCookieFilter } from '../automation/cookie/util'
import type { CDPSocketServer } from '@packages/socket'
import { WebKitCDPBridge } from './webkit-cdp-bridge'
import { AUT_FRAME_NAME_IDENTIFIER, isRunnerFrameName } from '@packages/types'
import { AUT_FRAME_HEADER } from './constants'
import { RemoteTabs, WebKitRemoteAgent } from '../automation/commands/remote_agent'
import { RemoteVisit } from '../automation/commands/remote_visit'
import type { AutScripts } from '../automation/commands/remote_visit'
import { RemoteClock } from '../automation/commands/remote_clock'
import { answerRemoteDialog, isRemoteDialogType } from '../automation/commands/remote_dialogs'
import { REMOTE_STUB_BINDING, RemoteStubs, parseStubCall } from '../automation/commands/remote_stubs'
import { getRemoteAutScript, callRemoteAut } from '../automation/commands/remote_aut_script'
import { RemoteErrorReports } from '../automation/commands/remote_errors'
import { webkitReloadFrame } from '../automation/commands/reload_frame'
import { webkitNavigateHistory } from '../automation/commands/navigate_history'

const debug = Debug('cypress:server:browsers:webkit-automation')

let requestIdCounter = 1
const requestIdMap = new WeakMap<playwright.Request, string>()
let downloadIdCounter = 1

type WebKitAutomationOpts = {
  automation: Automation
  browser: playwright.Browser
  initialUrl: string
  downloadsFolder: string
  videoApi?: RunModeVideoApi
  userAgent?: string | null
  isHeadless: boolean
  cdpSocketServer?: CDPSocketServer
  // launched for experimentalRemoteDriver, which drives the AUT from outside the page
  remoteDriver?: boolean
  remoteAutScript?: RemoteAutScriptConfig
}

export class WebKitAutomation {
  automation: Automation
  private browser: playwright.Browser
  private context!: playwright.BrowserContext
  private page!: playwright.Page
  private userAgent: string | null
  private isHeadless: boolean
  private remoteDriver: boolean
  private remoteAutScript?: RemoteAutScriptConfig
  private remoteAgent = new WebKitRemoteAgent()
  private remoteTabs = new RemoteTabs(() => {
    return this.getExtraPages().map((page) => {
      return {
        url: async () => page.url(),
        call: (request) => this.remoteAgent.call(page.mainFrame(), request),
      }
    })
  })

  private autScripts: AutScripts = {
    addPreloadScript: async (source) => {
      const script = await this.page.addInitScript({ content: source })

      // older playwright-webkit can't remove an init script, so there onBeforeLoad also runs on later AUT loads
      return async () => script?.dispose?.()
    },
    evaluateInAut: (expression) => this.getAutFrame().evaluate(expression),
  }

  private remoteVisit = new RemoteVisit(this.autScripts)

  private remoteClock = new RemoteClock(this.autScripts)

  private remoteErrors = new RemoteErrorReports(this.autScripts.evaluateInAut)

  private remoteStubs = new RemoteStubs({
    addPreloadScript: async (source) => {
      const script = await this.page.addInitScript({ content: `(${source})(window.${REMOTE_STUB_BINDING})` })

      return async () => script?.dispose?.()
    },
    callInAut: (source) => this.getAutFrame().evaluate(`(${source})(window.${REMOTE_STUB_BINDING})`),
  })

  cdpSocketServer?: CDPSocketServer

  private constructor (opts: WebKitAutomationOpts) {
    this.automation = opts.automation
    this.browser = opts.browser
    this.userAgent = opts.userAgent ?? null
    this.isHeadless = opts.isHeadless
    this.remoteDriver = !!opts.remoteDriver
    this.remoteAutScript = opts.remoteAutScript
    this.cdpSocketServer = opts.cdpSocketServer
  }

  // static initializer to avoid "not definitively declared"
  static async create (opts: WebKitAutomationOpts) {
    const wkAutomation = new WebKitAutomation(opts)

    await wkAutomation.reset({ downloadsFolder: opts.downloadsFolder, newUrl: opts.initialUrl, videoApi: opts.videoApi })

    return wkAutomation
  }

  public async reset (options: { downloadsFolder?: string, newUrl?: string, videoApi?: RunModeVideoApi }) {
    debug('resetting playwright page + context %o', options)
    // new context comes with new cache + storage
    const newContext = await this.browser.newContext({
      ignoreHTTPSErrors: true,
      ...(this.userAgent ? { userAgent: this.userAgent } : {}),
      // In headless mode, set a standard devicePixelRatio so that screenshots
      // are consistent regardless of the host machine's DPI (e.g. 2x locally
      // vs 1x in CI) and to avoid fuzzy text on high-DPI displays. This mirrors
      // Chrome, which only forces `--force-device-scale-factor=1` when headless.
      // https://github.com/cypress-io/cypress/issues/23808
      ...(this.isHeadless ? { deviceScaleFactor: 1 } : {}),
      recordVideo: options.videoApi && {
        dir: os.tmpdir(),
        size: { width: 1280, height: 720 },
      },
    })
    const contextStarted = new Date
    const oldPwPage = this.page

    this.page = await newContext.newPage()
    this.context = this.page.context()

    await this.page.addInitScript({
      content: `(${utils.listenForDownload.toString()})()`,
    })

    await this.context.exposeBinding('cypressDownloadLinkClicked', (source, downloadUrl) => {
      this.automation.onDownloadLinkClicked?.(downloadUrl)
    })

    // the automation socket must attach before the runner navigates so its window bindings exist when the driver connects
    await this.cdpSocketServer?.attachCDPClient(new WebKitCDPBridge(this.page))

    this.handleRequestEvents()
    if (this.remoteDriver) {
      if (this.remoteAutScript) {
        await this.page.addInitScript({ content: await getRemoteAutScript(this.remoteAutScript, { reportErrors: true }) })
      }

      await this.context.exposeBinding(REMOTE_STUB_BINDING, async (source, payload: string) => {
        try {
          if (source.frame === this.getAutFrame()) {
            await this.automation.push('remote:stub:call', parseStubCall(payload))
          }
        } catch (err) {
          debug('failed to report a stub call: %s', err?.message)
        }
      })

      this.listenForAutNavigation()

      // Playwright dismisses a dialog itself only while nothing listens for them
      this.page.on('dialog', (dialog) => {
        const type = dialog.type()

        if (!isRemoteDialogType(type)) {
          return dialog.dismiss()
        }

        return answerRemoteDialog(this.automation, type, dialog.message(), (accept) => accept ? dialog.accept() : dialog.dismiss())
        .catch((err) => debug('failed to report dialog: %s', err?.message))
      })
    }

    if (options.downloadsFolder) this.handleDownloadEvents(options.downloadsFolder)

    if (options.videoApi) this.recordVideo(options.videoApi, contextStarted)

    const promises: Promise<any>[] = []

    promises.push(this.markAutIframeRequests())

    if (oldPwPage) promises.push(oldPwPage.context().close())

    if (options.newUrl) promises.push(this.page.goto(options.newUrl))

    if (promises.length) await Promise.all(promises)
  }

  private recordVideo (videoApi: RunModeVideoApi, startedVideoCapture: Date) {
    videoApi.useVideoController({
      endVideoCapture: async () => {
        const pwVideo = this.page.video()

        if (!pwVideo) throw new Error('pw.page missing video in endVideoCapture, cannot save video')

        debug('ending video capture: closing page and saving video to %s', videoApi.videoName)

        await Promise.all([
          // pwVideo.saveAs will not resolve until the page closes, presumably we do want to close it
          this.page.close(),
          pwVideo.saveAs(videoApi.videoName),
        ])
      },
      writeVideoFrame: () => {
        throw new Error('writeVideoFrame called, but WebKit does not support streaming frame data.')
      },
      async restart () {
        // WebKit records to a page-scoped Playwright video that is finalized on page close, so a
        // single controller cannot be restarted to record a second spec. Instead of re-using the
        // controller, WebKit recycles the tab per spec and creates a fresh recording each time (see
        // run.ts), so this should never be reached. It remains as a defensive guard.
        throw new Error('Cannot restart WebKit video controller - its recording is tied to the page. WebKit records each spec to its own video by recreating the tab instead.')
      },
      postProcessFfmpegOptions: {
        // WebKit seems to record at the highest possible frame rate, so filter out duplicate frames before compressing
        // otherwise compressing with all these dupe frames can take a really long time
        // https://stackoverflow.com/q/37088517/3474615
        outputOptions: ['-vsync vfr'],
        videoFilters: 'mpdecimate',
      },
      startedVideoCapture,
    })
  }

  private async markAutIframeRequests () {
    function isAutIframeRequest (request: playwright.Request) {
      // is an iframe
      if (request.resourceType() !== 'document') return false

      let frame: playwright.Frame

      try {
        frame = request.frame()
      } catch (err) {
        // a new tab's first navigation, such as a target=_blank link, is issued before its frame exists
        return false
      }

      // is a top-level iframe (only 1 parent in chain)
      return !!frame.parentFrame() && !frame.parentFrame()?.parentFrame()
        // is not the runner itself
        && !request.url().includes('__cypress')
    }

    await this.context.route('**', (route, request) => {
      if (!isAutIframeRequest(request)) return route.continue()

      return route.continue({
        headers: {
          ...request.headers(),
          [AUT_FRAME_HEADER]: 'true',
        },
      })
    })
  }

  private handleDownloadEvents (downloadsFolder: string) {
    this.page.on('download', async (download) => {
      const id = downloadIdCounter++
      const suggestedFilename = download.suggestedFilename()
      const filePath = path.join(downloadsFolder, suggestedFilename)

      await this.automation.push('create:download', {
        id,
        url: download.url(),
        filePath,
        mime: mime.getType(suggestedFilename),
      })

      // NOTE: WebKit does have a `downloadsPath` option, but it is trashed after each run
      // Cypress trashes before runs - so we have to use `.saveAs` to move it
      await download.saveAs(filePath)

      await this.automation.push('complete:download', { id })
    })
  }

  private handleRequestEvents () {
    // emit preRequest to proxy
    this.page.on('request', (request) => {
      // ignore socket.io events
      // TODO: use config.socketIoRoute here instead
      if (request.url().includes('/__socket') || request.url().includes('/__cypress')) return

      // pw does not expose an ID on requests, so create one
      const requestId = String(requestIdCounter++)

      requestIdMap.set(request, requestId)

      const browserPreRequest = {
        requestId,
        method: request.method(),
        url: request.url(),
        // TODO: await request.allHeaders() causes this to not resolve in time
        headers: request.headers(),
        resourceType: normalizeResourceType(request.resourceType()),
        originalResourceType: request.resourceType(),
        documentURL: request.frame().url(),
        cdpRequestWillBeSentTimestamp: request.timing().requestStart,
        cdpRequestWillBeSentReceivedTimestamp: performance.now() + performance.timeOrigin,
      }

      debug('received request %o', { browserPreRequest })
      this.automation.onBrowserPreRequest?.(browserPreRequest)
    })

    this.page.on('requestfinished', async (request) => {
      const requestId = requestIdMap.get(request)

      if (!requestId) return

      const response = await request.response()

      const responseReceived = {
        requestId,
        status: response?.status(),
        headers: await response?.allHeaders(),
      }

      debug('received requestfinished %o', { responseReceived })

      this.automation.onRequestEvent?.('response:received', responseReceived)
    })

    // When a request fails (e.g. `req.destroy()` / `forceNetworkError` resets the
    // connection), the pre-request emitted on 'request' is never matched to a
    // response and would otherwise leak in the proxy's pre-request queue, causing
    // infinite request loops. Mirror the CDP (`Network.loadingFailed`) and BiDi
    // (`network.fetchError`) behavior by removing the orphaned pre-request.
    // @see https://github.com/cypress-io/cypress/issues/23810
    this.page.on('requestfailed', (request) => {
      const requestId = requestIdMap.get(request)

      if (!requestId) return

      debug('received requestfailed, removing pre-request %o', { requestId })

      this.automation.onRemoveBrowserPreRequest?.(requestId)
    })
  }

  private async getCookies (filter: CyCookieFilter): Promise<CyCookie[]> {
    const cookies = await this.context.cookies()

    return cookies
    .filter((cookie) => {
      return cookieMatches(cookie, filter)
    })
    .map(convertPlaywrightCookieToCyCookie)
  }

  private async getCookie (filter: CyCookieFilter) {
    const cookies = await this.context.cookies()

    if (!cookies.length) return null

    // first attempt to match cookie on strict domain
    let cookie = cookies.find((cookie) => {
      return cookieMatches(cookie, filter, { strictDomain: true })
    })

    if (!cookie) {
      cookie = cookies.find((cookie) => {
        // if unable to match closest via strict domain, then return a cookie that matches the apex domain
        return cookieMatches(cookie, filter)
      })

      if (!cookie) return null
    }

    return convertPlaywrightCookieToCyCookie(cookie)
  }

  /**
   * Clears one specific cookie
   * @param filter the cookie to be cleared
   * @returns the cleared cookie
   */
  private async clearCookie (filter: CyCookieFilter): Promise<CyCookieFilter> {
    // webkit doesn't have a way to only clear certain cookies, so we have
    // to clear all cookies and put back the ones we don't want cleared
    const allCookies = await this.context.cookies()
    // persist everything but the first cookie that matches
    const persistCookies = allCookies.reduce((memo, cookie) => {
      if (memo.matched || !cookieMatches(cookie, filter)) {
        memo.cookies.push(cookie)

        return memo
      }

      memo.matched = true

      return memo
    }, { matched: false, cookies: [] as playwright.Cookie[] }).cookies

    await this.context.clearCookies()

    if (persistCookies.length) await this.context.addCookies(persistCookies)

    return filter
  }

  /**
   * Clear all cookies
   * @returns cookies cleared
   */
  private async clearCookies (cookiesToClear: CyCookie[]): Promise<CyCookie[]> {
    // webkit doesn't have a way to only clear certain cookies, so we have
    // to clear all cookies and put back the ones we don't want cleared
    const allCookies = await this.context.cookies()
    const persistCookies = allCookies.filter((cookie) => {
      return !cookiesToClear.find((cookieToClear) => {
        return cookieMatches(cookie, cookieToClear)
      })
    })

    debug('clear cookies: %o', cookiesToClear)
    debug('put back cookies: %o', persistCookies)

    await this.context.clearCookies()

    if (persistCookies.length) await this.context.addCookies(persistCookies)

    return cookiesToClear
  }

  /**
   * Locates the AUT (application under test) frame within the runner page.
   * Playwright's `frame.name()` returns the frame's `name` attribute, falling
   * back to its `id` attribute, both of which the runner sets to
   * `Your project: '<projectName>'` (see AUT_FRAME_NAME_IDENTIFIER).
   */
  private isAutFrame (frame: playwright.Frame) {
    try {
      return frame === this.getAutFrame()
    } catch {
      return false
    }
  }

  // Playwright has no event for a URL change within a document, so an AUT frame navigation
  // with no navigation request in flight is taken to be one
  private listenForAutNavigation () {
    let pendingRequest: playwright.Request | undefined
    let autUrl: string | undefined

    const push = (navigation: RemoteNavigation) => {
      this.automation.push('remote:navigation', navigation).catch((err) => debug('failed to report AUT navigation: %s', err?.message))
    }

    const end = (request: playwright.Request | undefined) => {
      if (request && request === pendingRequest) {
        pendingRequest = undefined
        push({ event: 'stopped' })
      }
    }

    this.page.on('request', (request) => {
      if (request.isNavigationRequest() && this.isAutFrame(request.frame())) {
        pendingRequest = request
        push({ event: 'started' })
      }
    })

    this.page.on('requestfailed', end)
    this.page.on('download', () => end(pendingRequest))

    // a 204 or 205 response leaves the current document in place
    this.page.on('requestfinished', async (request) => {
      if (request === pendingRequest && [204, 205].includes((await request.response())?.status() ?? 0)) {
        end(request)
      }
    })

    this.page.on('framenavigated', (frame) => {
      if (!this.isAutFrame(frame)) {
        return
      }

      const previousUrl = autUrl

      autUrl = frame.url()

      if (pendingRequest) {
        const request = pendingRequest

        frame.waitForLoadState('load').finally(() => end(request))

        return
      }

      const isHashChange = !!previousUrl && previousUrl.split('#')[0] === autUrl.split('#')[0]

      push({ event: 'withinDocument', source: isHashChange ? 'hashchange' : 'history' })
    })
  }

  private getAutFrame (): playwright.Frame {
    const childFrames = this.page.mainFrame().childFrames()

    let autFrame = childFrames.find((frame) => frame.name().startsWith(AUT_FRAME_NAME_IDENTIFIER))

    // When running Cypress-in-Cypress E2E tests, the AUT frame is nested one
    // level deeper inside the outer AUT frame.
    if (process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF && autFrame) {
      autFrame = autFrame.childFrames().find((frame) => frame.name().startsWith(AUT_FRAME_NAME_IDENTIFIER)) ?? autFrame
    }

    // If for whatever reason we cannot identify the AUT frame by name, fall back to the first
    // child frame that is not one of the runner's own iframes — the AUT is the only child of top
    // that the runner does not name itself.
    if (!autFrame) {
      debug('could not identify AUT frame by name, falling back to the first non-runner child frame %o', { childFrameNames: childFrames.map((frame) => frame.name()) })
      autFrame = childFrames.find((frame) => !isRunnerFrameName(frame.name()))
    }

    if (!autFrame) {
      debug('could not find AUT frame: the runner page has no child frames')
      throw new Error('Could not find AUT frame')
    }

    return autFrame
  }

  // pages other than the runner's are tabs the app opened
  private getExtraPages () {
    return this.context.pages().filter((page) => page !== this.page)
  }

  async closeExtraPages () {
    await Promise.all(this.getExtraPages().map((page) => {
      return page.close().catch((err) => debug('closing extra page errored: %o', err))
    }))
  }

  private async takeScreenshot (data) {
    const buffer = await this.page.screenshot({
      fullPage: data.capture === 'fullPage',
      timeout: 0,
      type: 'png',
    })

    const b64data = buffer.toString('base64')

    return `data:image/png;base64,${b64data}`
  }

  onRequest = async (message, data) => {
    switch (message) {
      case 'is:automation:client:connected':
        return true
      case 'get:cookies':
        return await this.getCookies(data)
      case 'get:cookie':
        return await this.getCookie(data)
      case 'set:cookie':
        return await this.context.addCookies([convertCyCookieToPlaywrightCookie(data)])
      case 'add:cookies':
      case 'set:cookies':
        return await this.context.addCookies(data.map(convertCyCookieToPlaywrightCookie))
      case 'clear:cookies':
        return await this.clearCookies(data)
      case 'clear:cookie':
        return await this.clearCookie(data)
      case 'take:screenshot':
        return await this.takeScreenshot(data)
      case 'get:aut:url':
        return this.getAutFrame().url()
      case 'get:aut:title':
        return await this.getAutFrame().title()
      case 'reload:aut:frame':
        return await webkitReloadFrame(this.getAutFrame(), data.forceReload)
      case 'navigate:aut:history':
        return await webkitNavigateHistory(this.getAutFrame(), data.historyNumber)
      case 'remote:stub:add':
        return await this.remoteStubs.add(data)
      case 'remote:stub:update':
        return await this.remoteStubs.update(data)
      case 'remote:stubs:reset':
        return await this.remoteStubs.reset()
      case 'remote:clock:install':
        return await this.remoteClock.install(data)
      case 'remote:clock:tick':
        return await this.remoteClock.tick(data)
      case 'remote:clock:set:system:time':
        return await this.remoteClock.setSystemTime(data)
      case 'remote:clock:restore':
        return await this.remoteClock.restore()
      case 'remote:errors:flush':
        return await this.remoteErrors.flush()
      case 'remote:aut:call':
        return await callRemoteAut(this.autScripts.evaluateInAut, data)
      case 'remote:visit:before:load':
        return await this.remoteVisit.beforeLoad(data)
      case 'remote:visit:on:load':
        return await this.remoteVisit.onLoad(data)
      case 'remote:agent':
        return await this.remoteTabs.call(data, () => this.remoteAgent.call(this.getAutFrame(), data))
      case 'focus:browser:window':
        return await this.context.pages()[0]?.bringToFront()
      case 'reset:browser:state':
        debug('stubbed reset:browser:state')

        return
      case 'reset:browser:tabs:for:next:spec':
        if (data.shouldKeepTabOpen) return await this.reset({})

        return await this.context.browser()?.close()
      default:
        throw new Error(`No automation handler registered for: '${message}'`)
    }
  }
}
