/// <reference types='chrome'/>

import _ from 'lodash'
import Bluebird from 'bluebird'
import type { Protocol } from 'devtools-protocol'
import type ProtocolMapping from 'devtools-protocol/types/protocol-mapping'
import { cors, uri } from '@packages/network'
import debugModule from 'debug'
import { URL } from 'url'

import type { ResourceType, BrowserPreRequest, BrowserResponseReceived } from '@packages/proxy'
import type { WriteVideoFrame } from '@packages/types'
import type { Automation } from '../automation'
import { cookieMatches, CyCookie, CyCookieFilter } from '../automation/util'
import type { CriClient } from './cri-client'

export type CdpCommand = keyof ProtocolMapping.Commands

export type CdpEvent = keyof ProtocolMapping.Events

const debugVerbose = debugModule('cypress-verbose:server:browsers:cdp_automation')

export function screencastOpts (everyNthFrame = Number(process.env.CYPRESS_EVERY_NTH_FRAME || 5)): Protocol.Page.StartScreencastRequest {
  return {
    format: 'jpeg',
    everyNthFrame,
  }
}

function convertSameSiteExtensionToCdp (str: CyCookie['sameSite']): Protocol.Network.CookieSameSite | undefined {
  return str ? ({
    'no_restriction': 'None',
    'lax': 'Lax',
    'strict': 'Strict',
  })[str] : str as any
}

function convertSameSiteCdpToExtension (str: Protocol.Network.CookieSameSite): chrome.cookies.SameSiteStatus {
  if (_.isUndefined(str)) {
    return str
  }

  if (str === 'None') {
    return 'no_restriction'
  }

  return str.toLowerCase() as chrome.cookies.SameSiteStatus
}

// without this logic, a cookie being set on 'foo.com' will only be set for 'foo.com', not other subdomains
export function isHostOnlyCookie (cookie) {
  if (cookie.domain[0] === '.') return false

  const parsedDomain = cors.parseDomain(cookie.domain)

  // make every cookie non-hostOnly
  // unless it's a top-level domain (localhost, ...) or IP address
  return parsedDomain && parsedDomain.tld !== cookie.domain
}

const normalizeGetCookieProps = (cookie: Protocol.Network.Cookie): CyCookie => {
  if (cookie.expires === -1) {
    // @ts-ignore
    delete cookie.expires
  }

  if (isHostOnlyCookie(cookie)) {
    // @ts-ignore
    cookie.hostOnly = true
  }

  // @ts-ignore
  cookie.sameSite = convertSameSiteCdpToExtension(cookie.sameSite)

  // @ts-ignore
  cookie.expirationDate = cookie.expires
  // @ts-ignore
  delete cookie.expires

  // @ts-ignore
  return cookie
}

const normalizeGetCookies = (cookies: Protocol.Network.Cookie[]) => {
  return _.map(cookies, normalizeGetCookieProps)
}

const normalizeSetCookieProps = (cookie: CyCookie): Protocol.Network.SetCookieRequest => {
  // this logic forms a SetCookie request that will be received by Chrome
  // see MakeCookieFromProtocolValues for information on how this cookie data will be parsed
  // @see https://cs.chromium.org/chromium/src/content/browser/devtools/protocol/network_handler.cc?l=246&rcl=786a9194459684dc7a6fded9cabfc0c9b9b37174

  const setCookieRequest: Protocol.Network.SetCookieRequest = _({
    domain: cookie.domain,
    path: cookie.path,
    secure: cookie.secure,
    httpOnly: cookie.httpOnly,
    sameSite: convertSameSiteExtensionToCdp(cookie.sameSite),
    expires: cookie.expirationDate,
  })
  // Network.setCookie will error on any undefined/null parameters
  .omitBy(_.isNull)
  .omitBy(_.isUndefined)
  // set name and value at the end to get the correct typing
  .extend({
    name: cookie.name || '',
    value: cookie.value || '',
  })
  .value()

  // without this logic, a cookie being set on 'foo.com' will only be set for 'foo.com', not other subdomains
  if (!cookie.hostOnly && isHostOnlyCookie(cookie)) {
    setCookieRequest.domain = `.${cookie.domain}`
  }

  if (cookie.hostOnly && !isHostOnlyCookie(cookie)) {
    // @ts-ignore
    delete cookie.hostOnly
  }

  if (setCookieRequest.name.startsWith('__Host-')) {
    setCookieRequest.url = `https://${cookie.domain}`
    delete setCookieRequest.domain
  }

  return setCookieRequest
}

export const normalizeResourceType = (resourceType: string | undefined): ResourceType => {
  resourceType = resourceType ? resourceType.toLowerCase() : 'unknown'
  if (validResourceTypes.includes(resourceType as ResourceType)) {
    return resourceType as ResourceType
  }

  if (resourceType === 'img') {
    return 'image'
  }

  return ffToStandardResourceTypeMap[resourceType] || 'other'
}

type SendDebuggerCommand = <T extends CdpCommand>(message: T, data?: any) => Promise<ProtocolMapping.Commands[T]['returnType']>
type SendCloseCommand = (shouldKeepTabOpen: boolean) => Promise<any> | void
type OnFn = <T extends CdpEvent>(eventName: T, cb: (data: ProtocolMapping.Events[T][0]) => void) => void
interface HasFrame {
  frame: Protocol.Page.Frame
}

// the intersection of what's valid in CDP and what's valid in FFCDP
// Firefox: https://searchfox.org/mozilla-central/rev/98a9257ca2847fad9a19631ac76199474516b31e/remote/cdp/domains/parent/Network.jsm#22
// CDP: https://chromedevtools.github.io/devtools-protocol/tot/Network/#type-ResourceType
const validResourceTypes: ResourceType[] = ['fetch', 'xhr', 'websocket', 'stylesheet', 'script', 'image', 'font', 'cspviolationreport', 'ping', 'manifest', 'other']
const ffToStandardResourceTypeMap: { [ff: string]: ResourceType } = {
  'img': 'image',
  'csp': 'cspviolationreport',
  'webmanifest': 'manifest',
}

export class CdpAutomation {
  private frameTree: any
  private gettingFrameTree: any

  private constructor (private sendDebuggerCommandFn: SendDebuggerCommand, private onFn: OnFn, private sendCloseCommandFn: SendCloseCommand, private automation: Automation) {
    onFn('Network.requestWillBeSent', this.onNetworkRequestWillBeSent)
    onFn('Network.responseReceived', this.onResponseReceived)
  }

  async startVideoRecording (writeVideoFrame: WriteVideoFrame, screencastOpts) {
    this.onFn('Page.screencastFrame', async (e) => {
      writeVideoFrame(Buffer.from(e.data, 'base64'))
      try {
        await this.sendDebuggerCommandFn('Page.screencastFrameAck', { sessionId: e.sessionId })
      } catch (e) {
        // swallow this error if the CRI connection was reset
        if (!e.message.includes('browser CRI connection was reset')) {
          throw e
        }
      }
    })

    await this.sendDebuggerCommandFn('Page.startScreencast', screencastOpts)
  }

  static async create (sendDebuggerCommandFn: SendDebuggerCommand, onFn: OnFn, sendCloseCommandFn: SendCloseCommand, automation: Automation): Promise<CdpAutomation> {
    const cdpAutomation = new CdpAutomation(sendDebuggerCommandFn, onFn, sendCloseCommandFn, automation)

    await sendDebuggerCommandFn('Network.enable', {
      maxTotalBufferSize: 0,
      maxResourceBufferSize: 0,
      maxPostDataSize: 0,
    })

    return cdpAutomation
  }

  private onNetworkRequestWillBeSent = (params: Protocol.Network.RequestWillBeSentEvent) => {
    debugVerbose('received networkRequestWillBeSent %o', params)
    let url = params.request.url

    // in Firefox, the hash is incorrectly included in the URL: https://bugzilla.mozilla.org/show_bug.cgi?id=1715366
    if (url.includes('#')) url = url.slice(0, url.indexOf('#'))

    // Filter out "data:" urls from being cached - fixes: https://github.com/cypress-io/cypress/issues/17853
    // Chrome sends `Network.requestWillBeSent` events with data urls which won't actually be fetched
    // Example data url: "data:font/woff;base64,<base64 encoded string>"
    if (url.startsWith('data:')) {
      debugVerbose('skipping `data:` url %s', url)

      return
    }

    // Firefox: https://searchfox.org/mozilla-central/rev/98a9257ca2847fad9a19631ac76199474516b31e/remote/cdp/domains/parent/Network.jsm#397
    // Firefox lacks support for urlFragment and initiator, two nice-to-haves
    const browserPreRequest: BrowserPreRequest = {
      requestId: params.requestId,
      method: params.request.method,
      url,
      headers: params.request.headers,
      resourceType: normalizeResourceType(params.type),
      originalResourceType: params.type,
    }

    this.automation.onBrowserPreRequest?.(browserPreRequest)
  }

  private onResponseReceived = (params: Protocol.Network.ResponseReceivedEvent) => {
    const browserResponseReceived: BrowserResponseReceived = {
      requestId: params.requestId,
      status: params.response.status,
      headers: params.response.headers,
    }

    this.automation.onRequestEvent?.('response:received', browserResponseReceived)
  }

  private getAllCookies = (filter: CyCookieFilter) => {
    return this.sendDebuggerCommandFn('Network.getAllCookies')
    .then((result: Protocol.Network.GetAllCookiesResponse) => {
      return normalizeGetCookies(result.cookies)
      .filter((cookie: CyCookie) => {
        const matches = cookieMatches(cookie, filter)

        debugVerbose('cookie matches filter? %o', { matches, cookie, filter })

        return matches
      })
    })
  }

  private getCookiesByUrl = (url): Promise<CyCookie[]> => {
    return this.sendDebuggerCommandFn('Network.getCookies', {
      urls: [url],
    })
    .then((result: Protocol.Network.GetCookiesResponse) => {
      const isLocalhost = uri.isLocalhost(new URL(url))

      return normalizeGetCookies(result.cookies)
      .filter((cookie) => {
        // Chrome returns all cookies for a URL, even if they wouldn't normally
        // be sent with a request. This standardizes it by filtering out ones
        // that are secure but not on a secure context

        // localhost is considered a secure context (even when http:)
        // and it's required for cross origin support when visiting a secondary
        // origin so that all its cookies are sent.
        return !(cookie.secure && url.startsWith('http:') && !isLocalhost)
      })
    })
  }

  private getCookie = (filter: CyCookieFilter): Promise<CyCookie | null> => {
    return this.getAllCookies(filter)
    .then((cookies) => {
      return _.get(cookies, 0, null)
    })
  }

  // eslint-disable-next-line @cypress/dev/arrow-body-multiline-braces
  private _updateFrameTree = (client: CriClient, eventName) => async () => {
    debugVerbose(`update frame tree for ${eventName}`)

    this.gettingFrameTree = new Promise<void>(async (resolve) => {
      try {
        this.frameTree = (await client.send('Page.getFrameTree')).frameTree
        debugVerbose('frame tree updated')
      } catch (err) {
        debugVerbose('failed to update frame tree:', err.stack)
      } finally {
        this.gettingFrameTree = null

        resolve()
      }
    })
  }

  private _continueRequest = (client, params, header?) => {
    const details: Protocol.Fetch.ContinueRequestRequest = {
      requestId: params.requestId,
    }

    if (header) {
    // headers are received as an object but need to be an array
    // to modify them
      const currentHeaders = _.map(params.request.headers, (value, name) => ({ name, value }))

      details.headers = [
        ...currentHeaders,
        header,
      ]
    }

    debugVerbose('continueRequest: %o', details)

    client.send('Fetch.continueRequest', details).catch((err) => {
    // swallow this error so it doesn't crash Cypress.
    // an "Invalid InterceptionId" error can randomly happen in the driver tests
    // when testing the redirection loop limit, when a redirect request happens
    // to be sent after the test has moved on. this shouldn't crash Cypress, in
    // any case, and likely wouldn't happen for standard user tests, since they
    // will properly fail and not move on like the driver tests
      debugVerbose('continueRequest failed, url: %s, error: %s', params.request.url, err?.stack || err)
    })
  }

  private _isAUTFrame = async (frameId: string) => {
    debugVerbose('need frame tree')

    // the request could come in while in the middle of getting the frame tree,
    // which is asynchronous, so wait for it to be fetched
    if (this.gettingFrameTree) {
      debugVerbose('awaiting frame tree')

      await this.gettingFrameTree
    }

    const frame = _.find(this.frameTree?.childFrames || [], ({ frame }) => {
      return frame?.name?.startsWith('Your project:')
    }) as HasFrame | undefined

    if (frame) {
      return frame.frame.id === frameId
    }

    return false
  }

  _handlePausedRequests = async (client) => {
    // NOTE: only supported in chromium based browsers
    await client.send('Fetch.enable', {
      // only enable request pausing for documents to determine the AUT iframe
      patterns: [{
        resourceType: 'Document',
      }],
    })

    // adds a header to the request to mark it as a request for the AUT frame
    // itself, so the proxy can utilize that for injection purposes
    client.on('Fetch.requestPaused', async (params: Protocol.Fetch.RequestPausedEvent) => {
      if (await this._isAUTFrame(params.frameId)) {
        debugVerbose('add X-Cypress-Is-AUT-Frame header to: %s', params.request.url)

        return this._continueRequest(client, params, {
          name: 'X-Cypress-Is-AUT-Frame',
          value: 'true',
        })
      }

      return this._continueRequest(client, params)
    })
  }

  // we can't get the frame tree during the Fetch.requestPaused event, because
  // the CDP is tied up during that event and can't be utilized. so we maintain
  // a reference to it that's updated when it's likely to have been changed
  _listenForFrameTreeChanges = (client) => {
    debugVerbose('listen for frame tree changes')

    client.on('Page.frameAttached', this._updateFrameTree(client, 'Page.frameAttached'))
    client.on('Page.frameDetached', this._updateFrameTree(client, 'Page.frameDetached'))
  }

  onRequest = (message, data) => {
    let setCookie

    switch (message) {
      case 'get:cookies':
        if (data.url) {
          return this.getCookiesByUrl(data.url)
        }

        return this.getAllCookies(data)
      case 'get:cookie':
        return this.getCookie(data)
      case 'set:cookie':
        setCookie = normalizeSetCookieProps(data)

        return this.sendDebuggerCommandFn('Network.setCookie', setCookie)
        .then((result: Protocol.Network.SetCookieResponse) => {
          if (!result.success) {
            // i wish CDP provided some more detail here, but this is really it in v1.3
            // @see https://chromedevtools.github.io/devtools-protocol/tot/Network/#method-setCookie
            throw new Error(`Network.setCookie failed to set cookie: ${JSON.stringify(setCookie)}`)
          }

          return this.getCookie(data)
        })

      case 'add:cookies':
        setCookie = data.map((cookie) => normalizeSetCookieProps(cookie)) as Protocol.Network.SetCookieRequest[]

        return this.sendDebuggerCommandFn('Network.setCookies', { cookies: setCookie })

      case 'set:cookies':
        setCookie = data.map((cookie) => normalizeSetCookieProps(cookie))

        return this.sendDebuggerCommandFn('Network.clearBrowserCookies')
        .then(() => {
          return this.sendDebuggerCommandFn('Network.setCookies', { cookies: setCookie })
        })

      case 'clear:cookie':
        return this.getCookie(data)
        // always resolve with the value of the removed cookie. also, getting
        // the cookie via CDP first will ensure that we send a cookie `domain`
        // to CDP that matches the cookie domain that is really stored
        .then((cookieToBeCleared) => {
          if (!cookieToBeCleared) {
            return cookieToBeCleared
          }

          return this.sendDebuggerCommandFn('Network.deleteCookies', _.pick(cookieToBeCleared, 'name', 'domain'))
          .then(() => {
            return cookieToBeCleared
          })
        })

      case 'clear:cookies':
        return Bluebird.mapSeries(data as CyCookieFilter[], async (cookie) => {
          // resolve with the value of the removed cookie
          // also, getting the cookie via CDP first will ensure that we send a cookie `domain` to CDP
          // that matches the cookie domain that is really stored
          const cookieToBeCleared = await this.getCookie(cookie)

          if (!cookieToBeCleared) return

          await this.sendDebuggerCommandFn('Network.deleteCookies', _.pick(cookieToBeCleared, 'name', 'domain'))

          return cookieToBeCleared
        })

      case 'is:automation:client:connected':
        return true
      case 'remote:debugger:protocol':
        return this.sendDebuggerCommandFn(data.command, data.params)
      case 'take:screenshot':
        return this.sendDebuggerCommandFn('Page.captureScreenshot', { format: 'png' })
        .catch((err) => {
          throw new Error(`The browser responded with an error when Cypress attempted to take a screenshot.\n\nDetails:\n${err.message}`)
        })
        .then(({ data }) => {
          return `data:image/png;base64,${data}`
        })
      case 'reset:browser:state':
        return Promise.all([
          this.sendDebuggerCommandFn('Storage.clearDataForOrigin', { origin: '*', storageTypes: 'all' }),
          this.sendDebuggerCommandFn('Network.clearBrowserCache'),
        ])
      case 'reset:browser:tabs:for:next:test':
        return this.sendCloseCommandFn(data.shouldKeepTabOpen)
      case 'focus:browser:window':
        return this.sendDebuggerCommandFn('Page.bringToFront')
      case 'get:heap:size:limit':
        return this.sendDebuggerCommandFn('Runtime.evaluate', { expression: 'performance.memory.jsHeapSizeLimit' })
      case 'collect:garbage':
        return this.sendDebuggerCommandFn('HeapProfiler.collectGarbage')
      default:
        throw new Error(`No automation handler registered for: '${message}'`)
    }
  }
}
