/// <reference types='chrome'/>

import _ from 'lodash'
import Bluebird from 'bluebird'
import type { Protocol } from 'devtools-protocol'
import { cors } from '@packages/network'
import debugModule from 'debug'
import type { Automation } from '../automation'
import type { ResourceType, BrowserPreRequest, BrowserResponseReceived } from '@packages/proxy'

const debugVerbose = debugModule('cypress-verbose:server:browsers:cdp_automation')

export type CyCookie = Pick<chrome.cookies.Cookie, 'name' | 'value' | 'expirationDate' | 'hostOnly' | 'domain' | 'path' | 'secure' | 'httpOnly'> & {
  // use `undefined` instead of `unspecified`
  sameSite?: 'no_restriction' | 'lax' | 'strict'
}

// Cypress uses the webextension-style filtering
// https://developer.chrome.com/extensions/cookies#method-getAll
type CyCookieFilter = chrome.cookies.GetAllDetails

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

export const _domainIsWithinSuperdomain = (domain: string, suffix: string) => {
  const suffixParts = suffix.split('.').filter(_.identity)
  const domainParts = domain.split('.').filter(_.identity)

  return _.isEqual(suffixParts, domainParts.slice(domainParts.length - suffixParts.length))
}

export const _cookieMatches = (cookie: CyCookie, filter: CyCookieFilter) => {
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

const normalizeResourceType = (resourceType: string | undefined): ResourceType => {
  resourceType = resourceType ? resourceType.toLowerCase() : 'unknown'
  if (validResourceTypes.includes(resourceType as ResourceType)) {
    return resourceType as ResourceType
  }

  if (resourceType === 'img') {
    return 'image'
  }

  return ffToStandardResourceTypeMap[resourceType] || 'other'
}

type SendDebuggerCommand = (message: string, data?: any) => Promise<any>
type OnFn = (eventName: string, cb: Function) => void

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
  constructor (private sendDebuggerCommandFn: SendDebuggerCommand, onFn: OnFn, private automation: Automation) {
    onFn('Network.requestWillBeSent', this.onNetworkRequestWillBeSent)
    onFn('Network.responseReceived', this.onResponseReceived)
    sendDebuggerCommandFn('Network.enable', {
      maxTotalBufferSize: 0,
      maxResourceBufferSize: 0,
      maxPostDataSize: 0,
    })
  }

  private onNetworkRequestWillBeSent = (params: Protocol.Network.RequestWillBeSentEvent) => {
    debugVerbose('received networkRequestWillBeSent %o', params)
    let url = params.request.url

    // in Firefox, the hash is incorrectly included in the URL: https://bugzilla.mozilla.org/show_bug.cgi?id=1715366
    if (url.includes('#')) url = url.slice(0, url.indexOf('#'))

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
        const matches = _cookieMatches(cookie, filter)

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
      return normalizeGetCookies(result.cookies)
      .filter((cookie) => {
        return !(url.startsWith('http:') && cookie.secure)
      })
    })
  }

  private getCookie = (filter: CyCookieFilter): Promise<CyCookie | null> => {
    return this.getAllCookies(filter)
    .then((cookies) => {
      return _.get(cookies, 0, null)
    })
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
      default:
        throw new Error(`No automation handler registered for: '${message}'`)
    }
  }
}
