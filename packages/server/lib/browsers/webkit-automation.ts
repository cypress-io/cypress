import Debug from 'debug'
import type playwright from 'playwright-webkit'
import type { Automation } from '../automation'
import { normalizeResourceType } from './cdp_automation'
import os from 'os'
import type { RunModeVideoApi } from '@packages/types'
import path from 'path'
import mime from 'mime'
import { cookieMatches, CyCookieFilter } from '../automation/util'
import utils from './utils'

const debug = Debug('cypress:server:browsers:webkit-automation')

export type CyCookie = Pick<chrome.cookies.Cookie, 'name' | 'value' | 'expirationDate' | 'hostOnly' | 'domain' | 'path' | 'secure' | 'httpOnly'> & {
  // use `undefined` instead of `unspecified`
  sameSite?: 'no_restriction' | 'lax' | 'strict'
}

const extensionMap = {
  'no_restriction': 'None',
  'lax': 'Lax',
  'strict': 'Strict',
} as const

function convertSameSiteExtensionToCypress (str: CyCookie['sameSite']): 'None' | 'Lax' | 'Strict' | undefined {
  return str ? extensionMap[str] : undefined
}

const normalizeGetCookieProps = ({ name, value, domain, path, secure, httpOnly, sameSite, expires }: playwright.Cookie): CyCookie => {
  const cyCookie: CyCookie = {
    name,
    value,
    domain,
    path,
    secure,
    httpOnly,
    hostOnly: false,
    // Use expirationDate instead of expires
    ...expires !== -1 ? { expirationDate: expires } : {},
  }

  if (sameSite === 'None') {
    cyCookie.sameSite = 'no_restriction'
  } else if (sameSite) {
    cyCookie.sameSite = sameSite.toLowerCase() as CyCookie['sameSite']
  }

  return cyCookie
}

const normalizeSetCookieProps = (cookie: CyCookie): playwright.Cookie => {
  return {
    name: cookie.name,
    value: cookie.value,
    path: cookie.path,
    domain: cookie.domain,
    secure: cookie.secure,
    httpOnly: cookie.httpOnly,
    expires: cookie.expirationDate!,
    sameSite: convertSameSiteExtensionToCypress(cookie.sameSite)!,
  }
}

let requestIdCounter = 1
const requestIdMap = new WeakMap<playwright.Request, string>()
let downloadIdCounter = 1

type WebKitAutomationOpts = {
  automation: Automation
  browser: playwright.Browser
  initialUrl: string
  downloadsFolder: string
  videoApi?: RunModeVideoApi
}

export class WebKitAutomation {
  automation: Automation
  private browser: playwright.Browser
  private context!: playwright.BrowserContext
  private page!: playwright.Page

  private constructor (opts: WebKitAutomationOpts) {
    this.automation = opts.automation
    this.browser = opts.browser
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

    this.handleRequestEvents()

    if (options.downloadsFolder) this.handleDownloadEvents(options.downloadsFolder)

    if (options.videoApi) this.recordVideo(options.videoApi, contextStarted)

    let promises: Promise<any>[] = []

    promises.push(this.markAutIframeRequests())

    if (oldPwPage) promises.push(oldPwPage.context().close())

    if (options.newUrl) promises.push(this.page.goto(options.newUrl))

    if (promises.length) await Promise.all(promises)
  }

  private recordVideo (videoApi: RunModeVideoApi, startedVideoCapture: Date) {
    const _this = this

    videoApi.useVideoController({
      async endVideoCapture () {
        const pwVideo = _this.page.video()

        if (!pwVideo) throw new Error('pw.page missing video in endVideoCapture, cannot save video')

        debug('ending video capture, closing page...')

        await Promise.all([
          // pwVideo.saveAs will not resolve until the page closes, presumably we do want to close it
          _this.page.close(),
          pwVideo.saveAs(videoApi.videoName),
        ])
      },
      writeVideoFrame: () => {
        throw new Error('writeVideoFrame called, but WebKit does not support streaming frame data.')
      },
      async restart () {
        throw new Error('Cannot restart WebKit video - WebKit cannot record video on multiple specs in single-tab mode.')
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
      return (request.resourceType() === 'document')
        // is a top-level iframe (only 1 parent in chain)
        && request.frame().parentFrame() && !request.frame().parentFrame()?.parentFrame()
        // is not the runner itself
        && !request.url().includes('__cypress')
    }

    await this.context.route('**', (route, request) => {
      if (!isAutIframeRequest(request)) return route.continue()

      return route.continue({
        headers: {
          ...request.headers(),
          'X-Cypress-Is-AUT-Frame': 'true',
        },
      })
    })
  }

  private handleDownloadEvents (downloadsFolder: string) {
    this.page.on('download', async (download) => {
      const id = downloadIdCounter++
      const suggestedFilename = download.suggestedFilename()
      const filePath = path.join(downloadsFolder, suggestedFilename)

      this.automation.push('create:download', {
        id,
        url: download.url(),
        filePath,
        mime: mime.getType(suggestedFilename),
      })

      // NOTE: WebKit does have a `downloadsPath` option, but it is trashed after each run
      // Cypress trashes before runs - so we have to use `.saveAs` to move it
      await download.saveAs(filePath)

      this.automation.push('complete:download', { id })
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
  }

  private async getCookies (filter: CyCookieFilter): Promise<CyCookie[]> {
    const cookies = await this.context.cookies()

    return cookies
    .filter((cookie) => {
      return cookieMatches(cookie, filter)
    })
    .map(normalizeGetCookieProps)
  }

  private async getCookie (filter: CyCookieFilter) {
    const cookies = await this.context.cookies()

    if (!cookies.length) return null

    const cookie = cookies.find((cookie) => {
      return cookieMatches(cookie, filter)
    })

    if (!cookie) return null

    return normalizeGetCookieProps(cookie)
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
        return await this.context.addCookies([normalizeSetCookieProps(data)])
      case 'add:cookies':
      case 'set:cookies':
        return await this.context.addCookies(data.map(normalizeSetCookieProps))
      case 'clear:cookies':
        return await this.clearCookies(data)
      case 'clear:cookie':
        return await this.clearCookie(data)
      case 'take:screenshot':
        return await this.takeScreenshot(data)
      case 'focus:browser:window':
        return await this.context.pages[0]?.bringToFront()
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
