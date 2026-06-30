/// <reference types='chrome'/>

import _ from 'lodash'
import Bluebird from 'bluebird'
import type { Protocol } from 'devtools-protocol'
import type ProtocolMapping from 'devtools-protocol/types/protocol-mapping'
import { parseDomain, isLocalhost as isLocalhostNetworkTools } from '@packages/network-tools'
import type { DocumentDomainInjectionConfig } from '@packages/network-tools'
import debugModule from 'debug'
import { resourceTypeAndCredentialManager } from '@packages/proxy'
import type { RequestCredentialLevel } from '@packages/proxy'
import { URL } from 'url'
import { performance } from 'perf_hooks'

import type { ResourceType, BrowserPreRequest, BrowserResponseReceived } from '@packages/proxy'
import type { CDPClient, ProtocolManagerShape, WriteVideoFrame, AutomationMiddleware, AutomationCommands, BrowserLaunchOpts } from '@packages/types'
import type { Automation } from '../automation'
import { cookieMatches, CyCookie, CyCookieFilter } from '../automation/util'
import { DEFAULT_NETWORK_ENABLE_OPTIONS, CriClient } from './cri-client'
import { cdpKeyPress } from '../automation/commands/key_press'

import { toSupportedKey, AUT_FRAME_NAME_IDENTIFIER } from '@packages/types'

import { CdpBridgeInjectionAdapter } from '@packages/browser-automation'
import { cdpGetUrl } from '../automation/commands/get_url'
import { cdpReloadFrame } from '../automation/commands/reload_frame'
import { cdpNavigateHistory } from '../automation/commands/navigate_history'
import { cdpGetFrameTitle } from '../automation/commands/get_frame_title'
import { doesTopNeedToBeSimulated } from './wip_middleware'
import type { ForGetAutUrl, ForGetTopUrl, ForIsAutFrame } from './wip_middleware'
import { getSameSiteContext, shouldAttachAndSetCookies } from '@packages/proxy/lib/http/util/cookies'
import { Cookie } from 'tough-cookie'

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
  })[str] as Protocol.Network.CookieSameSite : str as undefined
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

  const parsedDomain = parseDomain(cookie.domain)

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

// shared "seen, no cookies" marker so cookieless responses don't each allocate a
// fresh array when recorded for the request/response correlation. frozen so a
// consumer can never mutate the shared instance.
const EMPTY_SET_COOKIE_HEADERS: readonly string[] = Object.freeze([])

// tough-cookie normalizes SameSite to lowercase ('strict' | 'lax' | 'none'), but
// CDP's CookieSameSite enum is capitalized. passing the lowercase value to
// Network.setCookie makes CDP reject the sameSite and store the cookie WITHOUT it
// (sameSite=undefined), which then defeats the request-side SameSite filtering.
const TOUGH_COOKIE_SAMESITE_TO_CDP: Record<string, Protocol.Network.CookieSameSite> = {
  strict: 'Strict',
  lax: 'Lax',
  none: 'None',
}

// safety net for the response-stage pause awaiting Set-Cookie headers that never
// arrive (a response that emits no Network.responseReceivedExtraInfo at all). it
// is NOT hit by normal responses, which find their entry without waiting.
const SET_COOKIE_EXTRA_INFO_TIMEOUT_MS = 1000

// Compute the cookie default-path (RFC 6265 §5.1.4) from a request URL, used when
// a Set-Cookie omits an explicit Path. We set it ourselves rather than relying on
// CDP to derive it from the url, so a cookie set on e.g. `/cookie-login` is scoped
// to `/` (and therefore visible to document.cookie on other paths) exactly as a
// browser would scope it.
const getDefaultCookiePath = (requestUrl: string): string => {
  const { pathname } = new URL(requestUrl)

  // no path, or doesn't start with '/', or only a single '/' segment -> '/'
  const lastSlash = pathname.lastIndexOf('/')

  if (!pathname.startsWith('/') || lastSlash === 0) {
    return '/'
  }

  // otherwise the path up to (but not including) the rightmost '/'
  return pathname.slice(0, lastSlash)
}

// Pull Set-Cookie values out of the raw headers from Network.responseReceivedExtraInfo.
// Duplicate headers there are collapsed into a single key whose value is the
// individual headers joined by `\n`, so split to recover each Set-Cookie.
const extractSetCookieHeaders = (headers: Protocol.Network.Headers): string[] => {
  const setCookieEntry = _.findKey(headers, (_value, name) => name.toLowerCase() === 'set-cookie')

  if (!setCookieEntry) {
    return []
  }

  return headers[setCookieEntry].split('\n')
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

export type SendDebuggerCommand = <T extends CdpCommand>(message: T, data?: ProtocolMapping.Commands[T]['paramsType'][0], sessionId?: string) => Promise<ProtocolMapping.Commands[T]['returnType']>

export type OnFn = <T extends CdpEvent>(eventName: T, cb: (data: ProtocolMapping.Events[T][0], sessionId?: string) => void) => void

export type OffFn = <T extends CdpEvent>(eventName: T, cb: (data: any) => void) => void

type SendCloseCommand = (shouldKeepTabOpen: boolean) => Promise<any> | void
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

export class CdpAutomation implements CDPClient, AutomationMiddleware {
  on: OnFn
  off: OffFn
  send: SendDebuggerCommand
  private frameTree: Protocol.Page.FrameTree | undefined
  private gettingFrameTree: Promise<void> | undefined | null
  private cachedDataUrlRequestIds: Set<string> = new Set()
  private executionContexts: Map<Protocol.Runtime.ExecutionContextId, Protocol.Runtime.ExecutionContextDescription> = new Map()
  // carries the request's credential level AND resourceType from the request-stage
  // Fetch pause to the response-stage pause for the same request. they are separate
  // CDP events with no shared context, and both values (resolved once via the
  // destructive resourceTypeAndCredentialManager.get()) are needed at both stages.
  // resourceType in particular must be carried because CDP's params.resourceType
  // mislabels some fetch requests as xhr; the credential manager's resourceType
  // (from the browser injection) is the accurate one. keyed by networkId, which is
  // stable across both stages (the Fetch requestId is not). entries are deleted
  // when the response is handled or the request fails.
  private credentialLevelByNetworkId: Map<string, { credentialStatus: RequestCredentialLevel, resourceType: ResourceType }> = new Map()
  // Chromium strips Set-Cookie from the cooked headers we get at the Fetch
  // response-stage pause; the raw Set-Cookie headers only arrive via
  // Network.responseReceivedExtraInfo. we correlate the two by networkId
  // (== the extra-info event's requestId). the two events have no guaranteed
  // ordering, so:
  //   - if extra-info lands first, we stash the result here (an EMPTY shared
  //     sentinel when there were no cookies, so the later pause knows not to wait)
  //   - if the pause lands first, it parks a resolver in pendingSetCookieResolvers
  //     for the extra-info handler to fulfill.
  // entries are consumed (and deleted) by the response-stage pause; extra-info
  // fires for every resource but only Document/XHR/Fetch are paused, so leftover
  // entries for non-paused resources are dropped on reset:browser:state.
  private setCookieHeadersByNetworkId: Map<string, readonly string[]> = new Map()
  private pendingSetCookieResolvers: Map<string, (setCookies: readonly string[]) => void> = new Map()
  // per-origin cookie snapshot (`name=value; ...`, httpOnly-filtered) embedded into
  // the document.cookie sync script so a freshly-loaded AUT frame seeds its mirror
  // SYNCHRONOUSLY (before page scripts run) - an async Runtime.evaluate push loses
  // that race. refreshed whenever we set cookies.
  private cookieSnapshotByOrigin: Map<string, string> = new Map()
  private cookieSyncScriptIdentifier: Protocol.Page.ScriptIdentifier | undefined

  private constructor (private sendDebuggerCommandFn: SendDebuggerCommand, private onFn: OnFn, private offFn: OffFn, private sendCloseCommandFn: SendCloseCommand, private automation: Automation, private focusTabOnScreenshot: boolean = false, private isHeadless: boolean = false) {
    onFn('Network.requestWillBeSent', this.onNetworkRequestWillBeSent)
    onFn('Network.responseReceived', this.onResponseReceived)
    onFn('Network.responseReceivedExtraInfo', this.onResponseReceivedExtraInfo)
    onFn('Network.requestServedFromCache', this.onRequestServedFromCache)
    onFn('Network.loadingFailed', this.onRequestFailed)
    onFn('ServiceWorker.workerRegistrationUpdated', this.onServiceWorkerRegistrationUpdated)
    onFn('ServiceWorker.workerVersionUpdated', this.onServiceWorkerVersionUpdated)

    onFn('Runtime.executionContextCreated', this.onExecutionContextCreated)
    onFn('Runtime.executionContextDestroyed', this.onExecutionContextDestroyed)

    this.on = onFn
    this.off = offFn
    this.send = sendDebuggerCommandFn
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

  static async create (sendDebuggerCommandFn: SendDebuggerCommand, onFn: OnFn, offFn: OffFn, sendCloseCommandFn: SendCloseCommand, automation: Automation, browserLaunchOpts: BrowserLaunchOpts, protocolManager?: ProtocolManagerShape, focusTabOnScreenshot: boolean = false, isHeadless?: boolean): Promise<CdpAutomation> {
    const cdpAutomation = new CdpAutomation(sendDebuggerCommandFn, onFn, offFn, sendCloseCommandFn, automation, focusTabOnScreenshot, isHeadless)

    await sendDebuggerCommandFn('Network.enable', protocolManager?.networkEnableOptions ?? DEFAULT_NETWORK_ENABLE_OPTIONS)

    // pick only the config keys the page-context injection needs. BrowserLaunchOpts doesn't type
    // these, but open_project merges the resolved Cypress config into the launch options at runtime.
    const { injectDocumentDomain, testingType, modifyObstructiveCode, experimentalModifyObstructiveThirdPartyCode } =
      browserLaunchOpts as BrowserLaunchOpts & DocumentDomainInjectionConfig & { modifyObstructiveCode?: boolean, experimentalModifyObstructiveThirdPartyCode?: boolean }

    const documentDomainConfig: DocumentDomainInjectionConfig = { injectDocumentDomain, testingType }

    // cross-origin spec-bridge `cypressConfig` (mirrors the proxy's fullCrossOrigin options).
    // simulatedCookies is hardcoded empty for now — it needs to be wired from the cookie jar
    // separately (https://github.com/cypress-io/cypress/issues/33860).
    const crossOriginConfig = {
      shouldInjectDocumentDomain: !!injectDocumentDomain && testingType !== 'component',
      modifyObstructiveThirdPartyCode: !!experimentalModifyObstructiveThirdPartyCode,
      modifyObstructiveCode: !!modifyObstructiveCode,
      simulatedCookies: [],
    }

    const autBridge = new CdpBridgeInjectionAdapter(sendDebuggerCommandFn, documentDomainConfig, crossOriginConfig)

    await sendDebuggerCommandFn('Page.enable')
    await autBridge.inject()

    return cdpAutomation
  }

  private async activateMainTab () {
    const ActivationTimeoutMessage = 'Unable to communicate with Cypress Extension'

    const sendActivationMessage = `
      (() => {
        if (document.defaultView !== top) { return Promise.resolve() }
        return new Promise((res) => {
          const onMessage = (ev) => {
            if (ev.data.message === 'cypress:extension:main:tab:activated') {
              window.removeEventListener('message', onMessage)
              res()
            }
          }

          window.addEventListener('message', onMessage)
          window.postMessage({ message: 'cypress:extension:activate:main:tab' })
        })
      })()`

    if (this.isHeadless) {
      debugVerbose('Headless, so bringing page to front instead of negotiating with extension')
      await this.sendDebuggerCommandFn('Page.bringToFront')
    } else {
      try {
        debugVerbose('sending activation message ', sendActivationMessage)
        await Promise.race([
          this.sendDebuggerCommandFn('Runtime.evaluate', {
            expression: sendActivationMessage,
            awaitPromise: true,
          }),
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error(ActivationTimeoutMessage)), 500)
          }),
        ])
      } catch (e) {
        debugVerbose('Error occurred while attempting to activate main tab: ', e)
        // If rejected due to timeout, fall back to bringing the main tab to focus -
        // this will steal window focus, so it is a last resort. If any other error
        // was thrown, re-throw as it was unexpected.
        if ((e as Error).message === ActivationTimeoutMessage) {
          await this.sendDebuggerCommandFn('Page.bringToFront')
        } else {
          throw e
        }
      }
    }
  }

  private onNetworkRequestWillBeSent = async (params: Protocol.Network.RequestWillBeSentEvent) => {
    debugVerbose('received networkRequestWillBeSent %o', params)

    let url = params.request.url

    // in Firefox, the hash is incorrectly included in the URL: https://bugzilla.mozilla.org/show_bug.cgi?id=1715366
    if (url.includes('#')) url = url.slice(0, url.indexOf('#'))

    // Filter out "data:" urls from being cached - fixes: https://github.com/cypress-io/cypress/issues/17853
    // Chrome sends `Network.requestWillBeSent` events with data urls which won't actually be fetched
    // Example data url: "data:font/woff;base64,<base64 encoded string>"
    if (url.startsWith('data:')) {
      debugVerbose('skipping data: url %s', url)
      this.cachedDataUrlRequestIds.add(params.requestId)

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
      initiator: params.initiator,
      documentURL: params.documentURL,
      hasRedirectResponse: params.redirectResponse != null,
      // wallTime is in seconds: https://vanilla.aslushnikov.com/?Network.TimeSinceEpoch
      // normalize to milliseconds to be comparable to everything else we're gathering
      cdpRequestWillBeSentTimestamp: params.wallTime * 1000,
      cdpRequestWillBeSentReceivedTimestamp: performance.now() + performance.timeOrigin,
    }

    await this.automation.onBrowserPreRequest?.(browserPreRequest)
  }

  private onRequestServedFromCache = (params: Protocol.Network.RequestServedFromCacheEvent) => {
    debugVerbose('received onRequestServedFromCache %o', params)

    // Filter out "data:" urls; they don't have a stored browserPreRequest
    // since they're not actually fetched
    if (this.cachedDataUrlRequestIds.has(params.requestId)) {
      this.cachedDataUrlRequestIds.delete(params.requestId)
      debugVerbose('skipping data: request %s', params.requestId)

      return
    }

    this.automation.onRemoveBrowserPreRequest?.(params.requestId)
  }

  private onRequestFailed = (params: Protocol.Network.LoadingFailedEvent) => {
    this.automation.onRemoveBrowserPreRequest?.(params.requestId)

    // release any Set-Cookie state stashed for this request if it failed before
    // reaching the response-stage pause that would normally consume it. the
    // Network loadingFailed requestId is the same value as the Fetch networkId.
    // if a pause is already awaiting, settle it with no cookies so it doesn't
    // hang until the timeout.
    this.credentialLevelByNetworkId.delete(params.requestId)
    this.setCookieHeadersByNetworkId.delete(params.requestId)

    const resolver = this.pendingSetCookieResolvers.get(params.requestId)

    if (resolver) {
      this.pendingSetCookieResolvers.delete(params.requestId)
      resolver(EMPTY_SET_COOKIE_HEADERS)
    }
  }

  // Set-Cookie is stripped from the cooked headers at the Fetch response-stage
  // pause, so we capture the raw Set-Cookie headers here (responseReceivedExtraInfo
  // carries the on-the-wire headers) keyed by networkId for the pause to consume.
  private onResponseReceivedExtraInfo = (params: Protocol.Network.ResponseReceivedExtraInfoEvent) => {
    const setCookies = extractSetCookieHeaders(params.headers)
    // record the EMPTY sentinel when there were no cookies so the pause can tell
    // "no cookies" apart from "extra-info hasn't arrived yet" without waiting.
    const result = setCookies.length ? setCookies : EMPTY_SET_COOKIE_HEADERS

    // if the response-stage pause already outran us and is awaiting, fulfill it;
    // otherwise stash the result for the pause to pick up when it fires.
    const resolver = this.pendingSetCookieResolvers.get(params.requestId)

    if (resolver) {
      this.pendingSetCookieResolvers.delete(params.requestId)
      resolver(result)

      return
    }

    this.setCookieHeadersByNetworkId.set(params.requestId, result)
  }

  // Retrieve (and release) the raw Set-Cookie headers for a request by networkId.
  // present => use it (the common order, no wait). absent => the pause outran
  // extra-info, so wait for it; the timeout only fires for the rare response that
  // emits no extra-info at all (e.g. some cache hits), so normal responses never
  // pay it.
  private _takeSetCookieHeaders = (networkId?: string): Promise<readonly string[]> => {
    if (!networkId) {
      return Promise.resolve(EMPTY_SET_COOKIE_HEADERS)
    }

    const stashed = this.setCookieHeadersByNetworkId.get(networkId)

    if (stashed) {
      this.setCookieHeadersByNetworkId.delete(networkId)

      return Promise.resolve(stashed)
    }

    return new Promise<readonly string[]>((resolve) => {
      const timeout = setTimeout(() => {
        this.pendingSetCookieResolvers.delete(networkId)
        resolve(EMPTY_SET_COOKIE_HEADERS)
      }, SET_COOKIE_EXTRA_INFO_TIMEOUT_MS)

      timeout.unref?.()

      this.pendingSetCookieResolvers.set(networkId, (setCookies) => {
        clearTimeout(timeout)
        resolve(setCookies)
      })
    })
  }

  // Set the given raw Set-Cookie header strings into the real browser store via
  // CDP, as if the AUT were top. Shared by the response-stage pause and the
  // document.cookie write-through binding. Enforces the cookie-name prefix rules
  // CDP itself doesn't, scopes domain/path the way the browser would, and honors
  // Max-Age/Expires. `defaultPath` is the path used for a cookie with no explicit
  // Path - the request default-path for HTTP Set-Cookie, but '/' for document.cookie
  // writes (matching the legacy patch's behavior, which the tests assert).
  private _setBrowserCookiesFromSetCookieHeaders = async (setCookies: readonly string[], url: string, defaultPath: string): Promise<void> => {
    const cookies = setCookies.map((cookie) => Cookie.parse(cookie))
    .filter((c): c is Cookie => c !== undefined)
    // CDP doesn't enforce __Secure-/__Host- name prefix rules; drop violators so
    // we don't store a cookie the browser would have rejected.
    .filter((c) => {
      if (c.key.startsWith('__Secure-')) {
        return c.secure
      }

      // __Host- requires Secure, no Domain, and effective Path=/ (tough-cookie
      // leaves path null when Set-Cookie omits it, which the browser default-paths
      // to / and accepts).
      if (c.key.startsWith('__Host-')) {
        return c.secure && !c.domain && (!c.path || c.path === '/')
      }

      return true
    })
    .map((cookie: Cookie) => {
      const cookieObj: Protocol.Network.SetCookieRequest = {
        name: cookie.key,
        value: cookie.value,
        // anchor to the url so CDP can derive host/scheme/port; a host-only
        // Set-Cookie (no Domain) has no domain to fall back on.
        url,
      }

      if (cookie.domain) {
        cookieObj.domain = cookie.domain

        // broaden to subdomains for a non-host-only Domain, reusing
        // isHostOnlyCookie so we don't double-dot or wrongly broaden TLDs/IPs.
        if (!cookie.hostOnly && isHostOnlyCookie(cookie)) {
          cookieObj.domain = `.${cookie.domain}`
        }
      }

      // explicit Path if present, else the browser default-path for the url
      // (don't let CDP narrow it from the request path).
      cookieObj.path = cookie.path ?? defaultPath

      if (cookie.secure) {
        cookieObj.secure = cookie.secure
      }

      if (cookie.httpOnly) {
        cookieObj.httpOnly = cookie.httpOnly
      }

      if (cookie.sameSite) {
        // tough-cookie is lowercase; CDP wants capitalized or it drops SameSite.
        cookieObj.sameSite = TOUGH_COOKIE_SAMESITE_TO_CDP[cookie.sameSite]
      } else {
        // tough-cookie leaves sameSite undefined for both an absent and an invalid
        // SameSite attribute; both default to Lax in the browser. Set it explicitly
        // so the stored cookie reports 'Lax' (CDP doesn't materialize the default
        // for Network.setCookie, so it would otherwise read back with no SameSite).
        cookieObj.sameSite = 'Lax'
      }

      // expiryTime() honors Max-Age (and its precedence over Expires). ms since
      // epoch, Infinity (session - omit), or -Infinity (expired - send epoch).
      const expiryTime = cookie.expiryTime()

      if (Number.isFinite(expiryTime)) {
        cookieObj.expires = expiryTime / 1000
      } else if (expiryTime === -Infinity) {
        cookieObj.expires = 0
      }

      return cookieObj
    })

    await this.sendDebuggerCommandFn('Network.setCookies', { cookies })

    // refresh the per-origin seed snapshot + on-new-document script so the next
    // document on this origin mirrors these cookies synchronously at load.
    await this._refreshCookieSnapshot(url)
  }

  // read the current cookies for `url`, store the httpOnly-filtered string keyed by
  // origin, and re-register the sync script with the updated snapshot.
  private _refreshCookieSnapshot = async (url: string): Promise<void> => {
    try {
      const origin = new URL(url).origin
      const { cookies } = await this.send('Network.getCookies', { urls: [url] })

      const cookieString = cookies
      .filter((cookie) => !cookie.httpOnly)
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join('; ')

      this.cookieSnapshotByOrigin.set(origin, cookieString)

      await this._refreshCookieSyncScript()
    } catch (err) {
      debugVerbose('failed to refresh cookie snapshot for %s: %o', url, (err as Error)?.stack || err)
    }
  }

  // Source for the document.cookie sync script registered via
  // Page.addScriptToEvaluateOnNewDocument. It runs in every new document BEFORE
  // any page script, self-guards to the cross-origin AUT frame (where the real
  // third-party document.cookie is blocked), seeds its mirror SYNCHRONOUSLY from
  // the embedded per-origin snapshot, and installs the getter/setter:
  //   - getter -> the local mirror
  //   - setter -> optimistic local update + write-through via __cypressCookieWrite
  //   - __cypressCookieSync(str) -> server push for post-load updates (write-through
  //     reconciliation, cy.setCookie/clearCookie, http Set-Cookie after load)
  private _buildCookieSyncScriptSource = (): string => {
    const snapshot = JSON.stringify(Object.fromEntries(this.cookieSnapshotByOrigin))
    const autIdentifier = JSON.stringify(AUT_FRAME_NAME_IDENTIFIER)

    return `;(function () {
  try {
    // only the AUT frame, and only when it's cross-origin to top (where the real
    // document.cookie is blocked); same-origin frames use native document.cookie.
    if (!window.name || window.name.indexOf(${autIdentifier}) !== 0) return

    var isCrossOriginToTop = false
    try { void window.top.location.href } catch (e) { isCrossOriginToTop = true }
    if (!isCrossOriginToTop) return

    var seed = ${snapshot}
    var cookieString = seed[location.origin] || ''

    var applyCookieToString = function (current, setCookie) {
      var pair = setCookie.split(';')[0]
      var name = (pair.split('=')[0] || '').trim()
      if (!name) return current
      var others = current.split('; ').filter(function (c) { return c && c.split('=')[0].trim() !== name })
      var lowered = setCookie.toLowerCase()
      var expired = /(^|;)\\s*max-age\\s*=\\s*(0|-)/.test(lowered) || /(^|;)\\s*expires\\s*=\\s*thu, 01 jan 1970/.test(lowered)
      if (expired) return others.join('; ')
      return others.concat([pair.trim()]).filter(Boolean).join('; ')
    }

    // server push for post-load updates; replaces the mirror with the
    // authoritative value the server computed from the real cookie store.
    Object.defineProperty(window, '__cypressCookieSync', {
      configurable: true,
      value: function (incoming) { cookieString = incoming || '' },
    })

    Object.defineProperty(document, 'cookie', {
      configurable: true,
      get: function () { return cookieString },
      set: function (v) {
        var value = '' + v
        cookieString = applyCookieToString(cookieString, value)
        if (window.__cypressCookieWrite) {
          window.__cypressCookieWrite(JSON.stringify({ cookie: value, url: location.href }))
        }

        return cookieString
      },
    })
  } catch (e) {}
})();`
  }

  // (Re)register the document.cookie sync script so newly-loaded documents seed
  // with the current snapshot. removing+re-adding only affects future documents.
  private _refreshCookieSyncScript = async (): Promise<void> => {
    try {
      if (this.cookieSyncScriptIdentifier) {
        await this.sendDebuggerCommandFn('Page.removeScriptToEvaluateOnNewDocument', { identifier: this.cookieSyncScriptIdentifier })
        this.cookieSyncScriptIdentifier = undefined
      }

      const { identifier } = await this.sendDebuggerCommandFn('Page.addScriptToEvaluateOnNewDocument', {
        source: this._buildCookieSyncScriptSource(),
      })

      this.cookieSyncScriptIdentifier = identifier
    } catch (err) {
      debugVerbose('failed to refresh cookie sync script: %o', (err as Error)?.stack || err)
    }
  }

  // find the main-world (default) execution context for a frame, to target the
  // server->page push at the AUT frame's document.cookie mirror.
  private _getDefaultExecutionContextId = (frameId: string): Protocol.Runtime.ExecutionContextId | undefined => {
    for (const [id, ctx] of this.executionContexts) {
      const auxData = ctx.auxData as { frameId?: string, isDefault?: boolean } | undefined

      if (auxData?.frameId === frameId && auxData?.isDefault) {
        return id
      }
    }

    return undefined
  }

  // server->page push: replace a loaded document's mirror with the authoritative
  // cookie string the server reads from the real store. handles post-load updates
  // the synchronous at-load seed can't (write-through reconciliation,
  // cy.setCookie/clearCookie, http Set-Cookie after the document loaded).
  private _pushCookiesToContext = async (contextId: Protocol.Runtime.ExecutionContextId, url: string): Promise<void> => {
    try {
      const { cookies } = await this.send('Network.getCookies', { urls: [url] })

      // document.cookie never exposes httpOnly cookies
      const cookieString = cookies
      .filter((cookie) => !cookie.httpOnly)
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join('; ')

      // guarded so contexts without the patch (top/reporter/same-origin) are no-ops
      await this.send('Runtime.evaluate', {
        expression: `window.__cypressCookieSync && window.__cypressCookieSync(${JSON.stringify(cookieString)})`,
        contextId,
      })
    } catch (err) {
      debugVerbose('failed to push cookies to context %d for %s: %o', contextId, url, err?.stack || err)
    }
  }

  // resolve a frame's loaded context and push the current cookies into its mirror.
  // no-op if the frame has no context yet (a just-navigated document seeds itself
  // synchronously from the on-new-document script instead).
  private _syncCookiesToFrame = async (frameId: string, url: string): Promise<void> => {
    const contextId = this._getDefaultExecutionContextId(frameId)

    if (contextId === undefined) {
      return
    }

    await this._pushCookiesToContext(contextId, url)
  }

  // after a cookie mutation via the automation client (cy.setCookie/clearCookie/
  // clearCookies), refresh the seed snapshot (future documents) and push to the
  // currently-loaded AUT frame (so document.cookie reflects it without a reload).
  private _syncCookiesAfterAutomationChange = async (): Promise<void> => {
    try {
      const autFrame = await this._getCachedAutFrame()

      if (!autFrame?.url) {
        return
      }

      await this._refreshCookieSnapshot(autFrame.url)
      await this._syncCookiesToFrame(autFrame.id, autFrame.url)
    } catch (err) {
      debugVerbose('failed to sync cookies after automation change: %o', (err as Error)?.stack || err)
    }
  }

  // after cookies are cleared via the automation client (cy.clearCookie/clearCookies,
  // and Cypress test-isolation between tests), drop the ENTIRE seed snapshot and
  // re-register the sync script so a stale cookie from this or another origin can't
  // seed into the next test's synchronous at-load document.cookie read, then push
  // the cleared state into the currently-loaded AUT frame.
  private _syncCookiesAfterClear = async (): Promise<void> => {
    try {
      this.cookieSnapshotByOrigin.clear()

      await this._refreshCookieSyncScript()

      const autFrame = await this._getCachedAutFrame()

      if (autFrame?.url) {
        await this._syncCookiesToFrame(autFrame.id, autFrame.url)
      }
    } catch (err) {
      debugVerbose('failed to sync cookies after clear: %o', (err as Error)?.stack || err)
    }
  }

  private onResponseReceived = (params: Protocol.Network.ResponseReceivedEvent) => {
    if (params.response.fromDiskCache || (params.response.fromServiceWorker && params.response.encodedDataLength <= 0)) {
      this.automation.onRemoveBrowserPreRequest?.(params.requestId)

      return
    }

    const browserResponseReceived: BrowserResponseReceived = {
      requestId: params.requestId,
      status: params.response.status,
      headers: params.response.headers,
    }

    this.automation.onRequestEvent?.('response:received', browserResponseReceived)
  }

  private onServiceWorkerRegistrationUpdated = (params: Protocol.ServiceWorker.WorkerRegistrationUpdatedEvent) => {
    this.automation.onServiceWorkerRegistrationUpdated?.(params)
  }

  private onServiceWorkerVersionUpdated = (params: Protocol.ServiceWorker.WorkerVersionUpdatedEvent) => {
    this.automation.onServiceWorkerVersionUpdated?.(params)
  }

  private onExecutionContextCreated = (event: Protocol.Runtime.ExecutionContextCreatedEvent) => {
    debugVerbose('new execution context:', event)
    this.executionContexts.set(event.context.id, event.context)

    // reconcile a newly-created main-world context's document.cookie mirror with
    // the LIVE store. the synchronous on-new-document seed serves the at-load read
    // but its snapshot is point-in-time, so it can be stale - e.g. a cookie that
    // expired (Max-Age/Expires) since the snapshot was captured is still in the
    // string. this async push corrects that (Cypress retries absorb the round-trip).
    // non-patched contexts (top/same-origin) are no-ops via the __cypressCookieSync guard.
    const { id, origin, auxData } = event.context

    if ((auxData as { isDefault?: boolean } | undefined)?.isDefault && origin && /^https?:/.test(origin)) {
      this._pushCookiesToContext(id, origin).catch(() => {})
    }
  }

  private onExecutionContextDestroyed = (event: Protocol.Runtime.ExecutionContextDestroyedEvent) => {
    debugVerbose('removing execution context', event)
    if (this.executionContexts.has(event.executionContextId)) {
      this.executionContexts.delete(event.executionContextId)
    }
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
      const isLocalhost = isLocalhostNetworkTools(new URL(url))

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

  private _continueRequest = (client: CriClient, params: Protocol.Fetch.RequestPausedEvent, headers: Protocol.Fetch.HeaderEntry[] = []) => {
    const details: Protocol.Fetch.ContinueRequestRequest = {
      requestId: params.requestId,
    }

    // headers are received as an object but Fetch.continueRequest needs an array.
    // we always rebuild from params.request.headers so any in-place edits made
    // before continuing (e.g. the `cookie` header set/removed during top
    // simulation) are sent, then append any extra headers the caller passes
    // (e.g. the AUT-frame marker).
    const currentHeaders = _.map(params.request.headers, (value, name) => ({ name, value }))

    details.headers = [
      ...currentHeaders,
      ...headers,
    ]

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

  private _continueResponse = (client: CriClient, params: Protocol.Fetch.RequestPausedEvent, responseHeaders?: Protocol.Fetch.HeaderEntry[]) => {
    const details: Protocol.Fetch.ContinueResponseRequest = {
      requestId: params.requestId,
    }

    // when provided, these override the headers the server sent back, which is
    // how we can inject/modify Set-Cookie headers for top simulation. if omitted,
    // the original response is continued untouched.
    if (responseHeaders) {
      details.responseHeaders = responseHeaders
    }

    debugVerbose('continueResponse: %o', details)

    client.send('Fetch.continueResponse', details).catch((err) => {
    // swallow this error so it doesn't crash Cypress, mirroring _continueRequest:
    // the paused response may be abandoned (e.g. an "Invalid InterceptionId")
    // if the request was torn down after the test moved on.
      debugVerbose('continueResponse failed, url: %s, error: %s', params.request.url, err?.stack || err)
    })
  }

  // this likely needs to be refactored to some type of stateless lookup for the http/2 middleware
  private _isAUTFrame = async (frameId: string) => {
    debugVerbose('need frame tree')

    // the request could come in while in the middle of getting the frame tree,
    // which is asynchronous, so wait for it to be fetched
    if (this.gettingFrameTree) {
      debugVerbose('awaiting frame tree')

      await this.gettingFrameTree
    }

    const frame = _.find(this.frameTree?.childFrames || [], ({ frame }) => {
      return frame?.name?.startsWith(AUT_FRAME_NAME_IDENTIFIER)
    }) as HasFrame | undefined

    if (frame) {
      return frame.frame.id === frameId
    }

    return false
  }

  private _getTopFrame = async (): Promise<Protocol.Page.Frame | undefined> => {
    // a request could come in while in the middle of getting the frame tree,
    // which is asynchronous, so wait for it to be fetched
    if (this.gettingFrameTree) {
      debugVerbose('awaiting frame tree')

      await this.gettingFrameTree
    }

    // the top frame is the root of the cached frame tree - it has no parent.
    // every other frame is nested somewhere under childFrames. callers read
    // `.url` off this to compare top's origin against the AUT's.
    return this.frameTree?.frame
  }

  // cached-frame-tree counterpart to _getAutFrame, for use inside the Fetch
  // pause handlers. _getAutFrame issues a live `Page.getFrameTree`, which
  // deadlocks while a request/response is paused (CDP is tied up); this reads
  // the cached tree the same way _getTopFrame / _isAUTFrame do.
  private _getCachedAutFrame = async (): Promise<Protocol.Page.Frame | undefined> => {
    if (this.gettingFrameTree) {
      debugVerbose('awaiting frame tree')

      await this.gettingFrameTree
    }

    const autFrame = _.find(this.frameTree?.childFrames || [], ({ frame }) => {
      return frame?.name?.startsWith(AUT_FRAME_NAME_IDENTIFIER)
    }) as HasFrame | undefined

    // fall back to the first child frame (the AUT frame in practice) when we
    // can't match by name, matching _getAutFrame's fallback.
    return autFrame?.frame ?? this.frameTree?.childFrames?.[0]?.frame
  }

  private _getAutFrame = async () => {
    try {
      if (this.gettingFrameTree) {
        debugVerbose('awaiting frame tree')

        await this.gettingFrameTree
      }

      // this seems redundant? we already have the frame tree and it shouldnt be stale given our most recent updates
      const frameTree = (await this.send('Page.getFrameTree')).frameTree

      let frame = _.find(frameTree?.childFrames || [], (item: HasFrame) => {
        return item.frame?.name?.startsWith(AUT_FRAME_NAME_IDENTIFIER)
      }) as HasFrame | undefined

      // If we are in E2E Cypress in Cypress testing, we need to get the frame from the child frames of the AUT frame. Else we are reloading what would be the "top" frame under test (with the AUT and reporter_)
      if (process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF && frame) {
        // @ts-expect-error
        frame = _.find(frame?.childFrames || [], (item: HasFrame) => {
          return item.frame?.name?.startsWith(AUT_FRAME_NAME_IDENTIFIER)
        }) as HasFrame | undefined
      }

      if (!frame) {
        // if for whatever reason we cannot identify the AUT frame by name, we will fall back to the first child frame that exists.
        // The first child frame should always be the AUT frame, followed by the spec frame
        if (frameTree?.childFrames?.[0]) {
          frame = frameTree.childFrames[0]
        } else {
          throw new Error('Could not find AUT frame')
        }
      }

      return frame.frame
    } catch (err) {
      debugVerbose('failed to get aut frame:', err.stack)

      throw new Error('Could not find AUT frame')
    }
  }

  _handlePausedRequests = async (client: CriClient) => {
    // NOTE: only supported in chromium based browsers
    await client.send('Fetch.enable', {
      // pause at BOTH the request and response stage for documents/XHR/fetch.
      // patterns without an explicit `requestStage` default to 'Request', so we
      // list each resource type twice to also get the 'Response' stage. the
      // request stage is where we attach cross-origin (simulated top) cookies to
      // the outgoing request; the response stage is where we capture Set-Cookie
      // headers coming back. this is the CDP-side home for the top-simulation
      // cookie logic that used to live in the MITM proxy middleware.
      patterns: [
        { resourceType: 'Document', requestStage: 'Request' },
        { resourceType: 'XHR', requestStage: 'Request' },
        { resourceType: 'Fetch', requestStage: 'Request' },
        { resourceType: 'Document', requestStage: 'Response' },
        { resourceType: 'XHR', requestStage: 'Response' },
        { resourceType: 'Fetch', requestStage: 'Response' },
      ],
    })

    // page -> server half of the document.cookie sync: the injected setter calls
    // this binding so a `document.cookie = ...` write in a third-party AUT frame is
    // persisted into the real store via CDP.
    await client.send('Runtime.addBinding', { name: '__cypressCookieWrite' })

    // server -> page: install the document.cookie sync script so the getter/setter
    // exist (and seed synchronously) in every new AUT document. refreshed with the
    // current snapshot whenever cookies change.
    await this._refreshCookieSyncScript()

    client.on('Runtime.bindingCalled', async (event: Protocol.Runtime.BindingCalledEvent) => {
      if (event.name !== '__cypressCookieWrite') {
        return
      }

      try {
        const { cookie, url } = JSON.parse(event.payload) as { cookie: string, url: string }

        // persist the write into the real store (applies real browser semantics:
        // rejects invalid/domain-mismatched, keeps duplicate keys), then push the
        // reconciled value back so the optimistic mirror is corrected. document.cookie
        // writes with no Path default to '/' (matches the legacy patch / test expectations).
        await this._setBrowserCookiesFromSetCookieHeaders([cookie], url, '/')
        await this._pushCookiesToContext(event.executionContextId, url)
      } catch (err) {
        debugVerbose('document.cookie write-through failed: %o', (err as Error)?.stack || err)
      }
    })

    client.on('Fetch.requestPaused', async (params: Protocol.Fetch.RequestPausedEvent) => {
      // a single event fires for both stages. when the response status code (or
      // a response error) is present, CDP has paused us at the response stage;
      // otherwise we're at the request stage.
      const isResponseStage = params.responseStatusCode !== undefined || params.responseErrorReason !== undefined

      // a paused request/response MUST always be continued — if a handler throws
      // (e.g. the cookie logic rejects on a bad Network.setCookie param), the
      // request would otherwise be stranded paused forever, hanging the browser
      // and leaving the reporter stuck loading. so guarantee a continue on error
      // and surface the cause.
      try {
        if (isResponseStage) {
          await this._onResponsePaused(client, params)
        } else {
          await this._onRequestPaused(client, params)
        }
      } catch (err) {
        debugVerbose('paused handler threw for %s (responseStage=%o), continuing to avoid hanging the request: %o', params.request.url, isResponseStage, (err as Error)?.stack || err)

        if (isResponseStage) {
          this._continueResponse(client, params)
        } else {
          this._continueRequest(client, params)
        }
      }
    })
  }

  // Request stage: outgoing request paused before it hits the network. This is
  // where the simulated-top cookie jar attaches cross-origin cookies to the
  // request (the CDP equivalent of the proxy's attachCrossOriginCookies adapter).
  private _onRequestPaused = async (client: CriClient, params: Protocol.Fetch.RequestPausedEvent) => {
    // TODO(http2-cookies): wire in cross-origin cookie attachment here.
    // Determine the cookies the simulated top would send for params.request.url
    // and merge them into the request's `cookie` header before continuing. Until
    // that's implemented this is a pass-through that preserves the existing
    // AUT-frame header behavior below.

    // if (await this._isAUTFrame(params.frameId)) {
    //   debugVerbose('add X-Cypress-Is-AUT-Frame header to: %s', params.request.url)

    //   // NOTE: we don't need to do this any longer as we dont need to inform the middleware of the AUT frame anymore for http2
    //   // but the middleware will need to have the ability to itendify the AUT frame, which it can lookup if it needs to be stateless?
    //   return this._continueRequest(client, params, {
    //     name: 'X-Cypress-Is-AUT-Frame',
    //     value: 'true',
    //   })
    // }

    const headersToAdd: Protocol.Fetch.HeaderEntry[] = []

    // EXAMPLE OF WHAT THE COMBINED MIDDLEWARE WOULD LOOK LIKE:

    // CDP specific implements to generic interface
    const getAUTUrl: ForGetAutUrl<void> = async () => {
      // use the cached frame tree (NOT a live Page.getFrameTree, which deadlocks
      // while a Fetch request/response is paused) to read the AUT frame's url.
      const autFrame = await this._getCachedAutFrame()

      return autFrame?.url ?? ''
    }
    const getTopUrl: ForGetTopUrl<void> = async () => {
      const topFrame = await this._getTopFrame()

      return topFrame?.url ?? ''
    }
    const isRequestAutFrame: ForIsAutFrame<void> = async () => {
      const isAutFrame = await this._isAUTFrame(params.frameId)

      return isAutFrame
    }

    const currentAUTUrl = await getAUTUrl()
    const currentTopUrl = await getTopUrl()
    const isAutFrame = await isRequestAutFrame()

    const doesTopNeedSimulation = await doesTopNeedToBeSimulated(currentAUTUrl, currentTopUrl, isAutFrame)

    // CalculateCredentialLevelIfApplicable
    // only need to get the credential level for xhr and fetch requests that need simulation. Otherwise, browser handles it natively
    if (doesTopNeedSimulation) {
      // unfortunately, to know whether to attach cross-origin cookies we need the
      // request's credential level (fetch `credentials`: omit/same-origin/include,
      // or XHR `withCredentials`), and CDP does NOT give it to us. Neither
      // Fetch.requestPaused nor Network.Request carries it - both model the
      // post-resolution network view, while `credentials` is a renderer-side
      // Fetch-spec property resolved before the request hits the network stack.
      // (Closest fields are useless here: Network.Request.isSameSite is a
      // same-site classification, not the mode, and requestWillBeSentExtraInfo's
      // associatedCookies is the outcome the browser computed against its REAL
      // origin, not the simulated top.) WebDriver BiDi has the same gap.
      //
      // So credential level must come from the browser-side capture we already
      // inject (the source feeding @packages/proxy's resourceTypeAndCredentialManager),
      // not from anything CDP hands us at pause time. Pull it from that singleton
      // here via `resourceTypeAndCredentialManager.get(url, resourceType)` and use
      // it to decide cookie attachment. Note .get() is destructive (shift off a
      // per-url queue), so this path must be the SOLE consumer when HTTP/2 is active.
      const normalizedUrl = new URL(params.request.url).toString()

      const normalizedResourceType = normalizeResourceType(params.resourceType)

      const { credentialStatus, resourceType } = resourceTypeAndCredentialManager.get(normalizedUrl, normalizedResourceType)

      // .get() is destructive, so stash the credential level and resourceType for
      // the matching response-stage pause (correlated by networkId) before it's
      // gone. resourceType is carried because CDP's params.resourceType is
      // unreliable (fetch can read as xhr); this one is from the browser injection.
      if (params.networkId) {
        this.credentialLevelByNetworkId.set(params.networkId, { credentialStatus, resourceType })
      }

      const shouldCookiesBeAttachedToRequest = shouldAttachAndSetCookies(normalizedUrl, await getAUTUrl(), resourceType, credentialStatus, isAutFrame)

      if (shouldCookiesBeAttachedToRequest) {
        // the browser's own cookie store is the source of truth for simulated-top
        // cookies (set into the browser via Network.setCookies on the response
        // side), so build the request's cookie header from the cookies the browser
        // holds for this url. getCookiesByUrl applies the same secure-context
        // filtering the browser would (Network.getCookies otherwise returns every
        // stored cookie, including Secure cookies it wouldn't actually send on an
        // http non-localhost request), so we don't attach cookies the browser
        // itself would withhold.
        //
        // Network.getCookies also ignores the request's SameSite context (it
        // doesn't know whether this is a same-site, top-level-nav, or cross-site
        // request), so we filter by it ourselves the way the tough-cookie jar used
        // to: a Strict cookie only goes on same-site requests, a Lax cookie on
        // same-site or top-level navigations, never on cross-site subresources.
        const sameSiteContext = getSameSiteContext(currentAUTUrl, normalizedUrl, isAutFrame)

        const allCookiesForUrl = await this.getCookiesByUrl(normalizedUrl)

        const browserCookies = allCookiesForUrl.filter((cookie) => {
          if (cookie.sameSite === 'strict') return sameSiteContext === 'strict'

          if (cookie.sameSite === 'lax') return sameSiteContext !== 'none'

          return true
        })

        const cookieHeader = browserCookies.map((cookie) => `${cookie.name}=${cookie.value}`).join('; ')

        if (cookieHeader) {
          headersToAdd.push({
            name: 'cookie',
            value: cookieHeader,
          })
        }
      }
    }

    return this._continueRequest(client, params, headersToAdd)
  }

  // Response stage: response headers received but not yet delivered to the
  // browser. This is where Set-Cookie headers are captured into the server-side
  // cookie jar and (when top is simulated) injected back so the browser sets
  // them (the CDP equivalent of the proxy's copyCookiesFromResponse adapter).
  private _onResponsePaused = async (client: CriClient, params: Protocol.Fetch.RequestPausedEvent) => {
    debugVerbose('response paused for: %s (status %d)', params.request.url, params.responseStatusCode)

    // TODO(http2-cookies): wire in Set-Cookie capture/injection here.
    // Read Set-Cookie from params.responseHeaders, record them in the cookie
    // jar, and pass a modified responseHeaders array to _continueResponse to
    // inject simulated-top cookies. Until that's implemented we continue the
    // response untouched.

    // use the network events

    // CDP specific implements to generic interface
    const getAUTUrl: ForGetAutUrl<void> = async () => {
      // use the cached frame tree (NOT a live Page.getFrameTree, which deadlocks
      // while a Fetch request/response is paused) to read the AUT frame's url.
      const autFrame = await this._getCachedAutFrame()

      return autFrame?.url ?? ''
    }
    const getTopUrl: ForGetTopUrl<void> = async () => {
      const topFrame = await this._getTopFrame()

      return topFrame?.url ?? ''
    }
    const isRequestAutFrame: ForIsAutFrame<void> = async () => {
      const isAutFrame = await this._isAUTFrame(params.frameId)

      return isAutFrame
    }

    const currentAUTUrl = await getAUTUrl()
    const currentTopUrl = await getTopUrl()
    const isAutFrame = await isRequestAutFrame()

    const doesTopNeedSimulation = await doesTopNeedToBeSimulated(currentAUTUrl, currentTopUrl, isAutFrame)

    if (doesTopNeedSimulation) {
      // retrieve the credential level and resourceType stashed during the
      // request-stage pause for this same request (correlated by networkId), then
      // release the entry.
      const requestMeta = params.networkId ? this.credentialLevelByNetworkId.get(params.networkId) : undefined

      if (params.networkId) {
        this.credentialLevelByNetworkId.delete(params.networkId)
      }

      const credentialStatus = requestMeta?.credentialStatus

      // prefer the resourceType stashed from the request stage (sourced from the
      // browser injection) since CDP's params.resourceType mislabels some fetch
      // requests as xhr; fall back to the CDP value if we have no stashed entry.
      const normalizedResourceType = requestMeta?.resourceType ?? normalizeResourceType(params.resourceType)

      // Set-Cookie is stripped from params.responseHeaders at this stage, so pull
      // the raw Set-Cookie headers captured from Network.responseReceivedExtraInfo
      // (correlated by networkId). these are the cookies the response is trying to
      // set, which the jar wiring will consume.
      const setCookies = await this._takeSetCookieHeaders(params.networkId)

      const normalizedUrl = new URL(params.request.url).toString()

      const shouldCookiesBeAttachedToResponse = shouldAttachAndSetCookies(normalizedUrl, await getAUTUrl(), normalizedResourceType, credentialStatus, isAutFrame)

      if (shouldCookiesBeAttachedToResponse && setCookies.length > 0) {
        // set the response's cookies into the real browser store as if the AUT
        // were top. _setBrowserCookiesFromSetCookieHeaders refreshes the per-origin
        // snapshot + on-new-document sync script (next document seeds at load);
        // the push updates the currently-loaded frame if it's already open.
        // HTTP Set-Cookie with no Path uses the request's default-path (browser behavior)
        await this._setBrowserCookiesFromSetCookieHeaders(setCookies, params.request.url, getDefaultCookiePath(params.request.url))
        await this._syncCookiesToFrame(params.frameId, normalizedUrl)
      }
    }

    return this._continueResponse(client, params)
  }

  // we can't get the frame tree during the Fetch.requestPaused event, because
  // the CDP is tied up during that event and can't be utilized. so we maintain
  // a reference to it that's updated when it's likely to have been changed.
  //
  // for HTTP/2 (similar to how it works today): we fetch and cache the frame
  // tree when a frame is added/removed (Page.frameAttached/frameDetached) or
  // when a frame navigates (Page.frameNavigated). navigation matters because a
  // frame's url changes without the frame being added/removed, and we rely on
  // the cached frame urls to compare the AUT frame's url against top's.
  // as requests multiplex in and pause, if we happen to be mid-fetch of the
  // frame tree, the paused request stream is held up (via `this.gettingFrameTree`)
  // until the frame tree resolves, which keeps us correct. from that cached
  // tree we can then resolve top and the AUT frame (see _getTopFrame /
  // _isAUTFrame). this is effectively "stateless" per request - we don't track
  // per-request frame state, we just rely on the cached frame tree snapshot.
  _listenForFrameTreeChanges = (client: CriClient) => {
    debugVerbose('listen for frame tree changes')

    client.on('Page.frameAttached', this._updateFrameTree(client, 'Page.frameAttached'))
    client.on('Page.frameDetached', this._updateFrameTree(client, 'Page.frameDetached'))
    client.on('Page.frameNavigated', this._updateFrameTree(client, 'Page.frameNavigated'))
  }

  onRequest = async <T extends keyof AutomationCommands>(message: T, data: AutomationCommands[T]['dataType']): Promise<AutomationCommands[T]['returnType']> => {
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

          // reflect the change in the AUT frame's document.cookie mirror
          void this._syncCookiesAfterAutomationChange()

          return this.getCookie(data)
        })

      case 'add:cookies':
        setCookie = data.map((cookie) => normalizeSetCookieProps(cookie)) as Protocol.Network.SetCookieRequest[]

        return this.sendDebuggerCommandFn('Network.setCookies', { cookies: setCookie })
        .then((result) => {
          void this._syncCookiesAfterAutomationChange()

          return result
        })

      case 'set:cookies':
        setCookie = data.map((cookie) => normalizeSetCookieProps(cookie))

        return this.sendDebuggerCommandFn('Network.clearBrowserCookies')
        .then(() => {
          return this.sendDebuggerCommandFn('Network.setCookies', { cookies: setCookie })
        })
        .then((result) => {
          void this._syncCookiesAfterAutomationChange()

          return result
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
            // clear the seed snapshot + reflect the removal in the AUT frame
            void this._syncCookiesAfterClear()

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
        .then((cleared) => {
          // clear the seed snapshot + reflect the removals in the AUT frame
          void this._syncCookiesAfterClear()

          return cleared
        })

      case 'is:automation:client:connected':
        return true
      case 'remote:debugger:protocol':
        return this.sendDebuggerCommandFn(data.command, data.params, data.sessionId)
      case 'take:screenshot':
        debugVerbose('capturing screenshot')

        if (this.focusTabOnScreenshot) {
          try {
            await this.activateMainTab()
          } catch (e) {
            debugVerbose('Error while attempting to activate main tab: %o', e)
          }
        }

        return this.sendDebuggerCommandFn('Page.captureScreenshot', { format: 'png' })
        .catch((err) => {
          throw new Error(`The browser responded with an error when Cypress attempted to take a screenshot.\n\nDetails:\n${err.message}`)
        })
        .then(({ data }) => {
          return `data:image/png;base64,${data}`
        })
      case 'reset:browser:state':
        // drop any per-request correlation entries that were never consumed by a
        // response-stage pause (e.g. Set-Cookie sentinels recorded for non-paused
        // resources like images/scripts), so they don't carry across specs.
        this.setCookieHeadersByNetworkId.clear()
        this.pendingSetCookieResolvers.clear()
        this.credentialLevelByNetworkId.clear()

        return Promise.all([
          // Note that we are omitting `file_systems` as it is very non-performant to clear:
          // https://github.com/cypress-io/cypress/pull/32703
          this.sendDebuggerCommandFn('Storage.clearDataForOrigin', { origin: '*', storageTypes: 'cookies,indexeddb,local_storage,shader_cache,service_workers,cache_storage,interest_groups,shared_storage' }),
          this.sendDebuggerCommandFn('Network.clearBrowserCache'),
        ])
      case 'reset:browser:tabs:for:next:spec':
        return this.sendCloseCommandFn(data.shouldKeepTabOpen)
      case 'focus:browser:window':
        return this.sendDebuggerCommandFn('Page.bringToFront')
      case 'get:heap:size:limit':
        return this.sendDebuggerCommandFn('Runtime.evaluate', { expression: 'performance.memory.jsHeapSizeLimit' })
      case 'collect:garbage':
        return this.sendDebuggerCommandFn('HeapProfiler.collectGarbage')
      case 'key:press':
        return cdpKeyPress(toSupportedKey(data.key), this.sendDebuggerCommandFn, this.executionContexts, (await this.send('Page.getFrameTree')).frameTree)
      case 'get:aut:url':
        return cdpGetUrl(this.sendDebuggerCommandFn, this.executionContexts, await this._getAutFrame())
      case 'reload:aut:frame':
        return cdpReloadFrame(this.sendDebuggerCommandFn, this.executionContexts, await this._getAutFrame(), data.forceReload)
      case 'navigate:aut:history':
        return cdpNavigateHistory(this.sendDebuggerCommandFn, this.executionContexts, await this._getAutFrame(), data.historyNumber)
      case 'get:aut:title':
        return cdpGetFrameTitle(this.sendDebuggerCommandFn, this.executionContexts, await this._getAutFrame())
      default:
        throw new Error(`No automation handler registered for: '${message}'`)
    }
  }
}
