import _ from 'lodash'
import Debug from 'debug'
import type playwright from 'playwright-webkit'
import type { Automation } from '../automation'
import { normalizeResourceType } from './cdp_automation'
import os from 'os'
import type { RunModeVideoApi } from '@packages/types'

const debug = Debug('cypress:server:browsers:webkit-automation')

export type CyCookie = Pick<chrome.cookies.Cookie, 'name' | 'value' | 'expirationDate' | 'hostOnly' | 'domain' | 'path' | 'secure' | 'httpOnly'> & {
  // use `undefined` instead of `unspecified`
  sameSite?: 'no_restriction' | 'lax' | 'strict'
}

type CookieFilter = {
  name: string
  domain: string
}

const extensionMap = {
  'no_restriction': 'None',
  'lax': 'Lax',
  'strict': 'Strict',
} as const

function convertSameSiteExtensionToCypress (str: CyCookie['sameSite']): 'None' | 'Lax' | 'Strict' | undefined {
  return str ? extensionMap[str] : undefined
}

const normalizeGetCookieProps = (cookie: any): CyCookie => {
  if (cookie.expires === -1) {
    delete cookie.expires
  }

  // Use expirationDate instead of expires 🤷‍♀️
  cookie.expirationDate = cookie.expires
  delete cookie.expires

  if (cookie.sameSite === 'None') {
    cookie.sameSite = 'no_restriction'
  } else if (cookie.sameSite) {
    cookie.sameSite = cookie.sameSite.toLowerCase()
  }

  return cookie as CyCookie
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

const _domainIsWithinSuperdomain = (domain: string, suffix: string) => {
  const suffixParts = suffix.split('.').filter(_.identity)
  const domainParts = domain.split('.').filter(_.identity)

  return _.isEqual(suffixParts, domainParts.slice(domainParts.length - suffixParts.length))
}

const _cookieMatches = (cookie: any, filter: Record<string, any>) => {
  if (filter.domain && !(cookie.domain && _domainIsWithinSuperdomain(cookie.domain, filter.domain))) {
    return false
  }

  if (filter.path && filter.path !== cookie.path) {
    return false
  }

  if (filter.name && filter.name !== cookie.name) {
    return false
  }

  return true
}

let requestIdCounter = 1
const requestIdMap = new WeakMap<playwright.Request, string>()

export class WebKitAutomation {
  private context!: playwright.BrowserContext
  private page!: playwright.Page

  private constructor (public automation: Automation, private browser: playwright.Browser) {}

  // static initializer to avoid "not definitively declared"
  static async create (automation: Automation, browser: playwright.Browser, initialUrl: string, videoApi?: RunModeVideoApi) {
    const wkAutomation = new WebKitAutomation(automation, browser)

    await wkAutomation.reset(initialUrl, videoApi)

    return wkAutomation
  }

  public async reset (newUrl?: string, videoApi?: RunModeVideoApi) {
    debug('resetting playwright page + context %o', { newUrl })
    // new context comes with new cache + storage
    const newContext = await this.browser.newContext({
      ignoreHTTPSErrors: true,
      recordVideo: videoApi && {
        dir: os.tmpdir(),
        size: { width: 1280, height: 720 },
      },
    })
    const contextStarted = new Date
    const oldPwPage = this.page

    this.page = await newContext.newPage()
    this.context = this.page.context()

    this.attachListeners(this.page)
    if (videoApi) this.recordVideo(videoApi, contextStarted)

    let promises: Promise<any>[] = []

    if (oldPwPage) promises.push(oldPwPage.context().close())

    if (newUrl) promises.push(this.page.goto(newUrl))

    if (promises.length) await Promise.all(promises)
  }

  private recordVideo (videoApi: RunModeVideoApi, startedVideoCapture: Date) {
    const _this = this

    videoApi.setVideoController({
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

  private attachListeners (page: playwright.Page) {
    // emit preRequest to proxy
    page.on('request', (request) => {
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
      }

      debug('received request %o', { browserPreRequest })
      this.automation.onBrowserPreRequest?.(browserPreRequest)
    })

    page.on('requestfinished', async (request) => {
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

  private async getCookies () {
    const cookies = await this.context.cookies()

    return cookies.map(normalizeGetCookieProps)
  }

  private async getCookie (filter: CookieFilter) {
    const cookies = await this.context.cookies()

    if (!cookies.length) return null

    const cookie = cookies.find((cookie) => {
      return _cookieMatches(cookie, {
        domain: filter.domain,
        name: filter.name,
      })
    })

    if (!cookie) return null

    return normalizeGetCookieProps(cookie)
  }

  private async clearCookie (filter: CookieFilter) {
    const allCookies = await this.context.cookies()
    const persistCookies = allCookies.filter((cookie) => {
      return !_cookieMatches(cookie, filter)
    })

    await this.context.clearCookies()
    if (persistCookies.length) await this.context.addCookies(persistCookies)
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
        return await this.getCookies()
      case 'get:cookie':
        return await this.getCookie(data)
      case 'set:cookie':
        return await this.context.addCookies([normalizeSetCookieProps(data)])
      case 'add:cookies':
      case 'set:cookies':
        return await this.context.addCookies(data.map(normalizeSetCookieProps))
      case 'clear:cookies':
        return await this.context.clearCookies()
      case 'clear:cookie':
        return await this.clearCookie(data)
      case 'take:screenshot':
        return await this.takeScreenshot(data)
      case 'focus:browser:window':
        return await this.context.pages[0]?.bringToFront()
      case 'reset:browser:state':
        return
      case 'reset:browser:tabs:for:next:test':
        if (data.shouldKeepTabOpen) return await this.reset()

        return await this.context.browser()?.close()
      default:
        throw new Error(`No automation handler registered for: '${message}'`)
    }
  }
}
