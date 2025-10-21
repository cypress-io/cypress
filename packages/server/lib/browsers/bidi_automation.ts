import debugModule from 'debug'
import toInteger from 'lodash/toInteger'
import isNumber from 'lodash/isNumber'
import { isHostOnlyCookie } from './cdp_automation'
import { cookieMatches } from '../automation/util'
import { bidiKeyPress } from '../automation/commands/key_press'
import { AutomationNotImplemented } from '../automation/automation_not_implemented'

import type Protocol from 'devtools-protocol'
import type { Automation } from '../automation'
import type { BrowserPreRequest, BrowserResponseReceived, ResourceType } from '@packages/proxy'
import { AutomationMiddleware, AutomationCommands, toSupportedKey } from '@packages/types'
import type { Client as WebDriverClient } from 'webdriver'
import type {
  NetworkBeforeRequestSentParameters,
  NetworkResponseStartedParameters,
  NetworkResponseCompletedParameters,
  NetworkFetchErrorParameters,
  NetworkCookie,
  BrowsingContextInfo,
  NetworkSameSite,
} from 'webdriver/build/bidi/localTypes'
import type { CyCookie as CyBaseCookie } from '../automation/util'
import { bidiGetUrl } from '../automation/commands/get_url'
import { bidiReloadFrame } from '../automation/commands/reload_frame'
import { bidiNavigateHistory } from '../automation/commands/navigate_history'
import { bidiGetFrameTitle } from '../automation/commands/get_frame_title'
import type { StorageCookieFilter, StoragePartialCookie as BidiStoragePartialCookie } from 'webdriver/build/bidi/remoteTypes'

const BIDI_DEBUG_NAMESPACE = 'cypress:server:browsers:bidi_automation'
const BIDI_COOKIE_DEBUG_NAMESPACE = `${BIDI_DEBUG_NAMESPACE}:cookies`
const BIDI_SCREENSHOT_DEBUG_NAMESPACE = `${BIDI_DEBUG_NAMESPACE}:screenshot`

const debug = debugModule(BIDI_DEBUG_NAMESPACE)
const debugCookies = debugModule(BIDI_COOKIE_DEBUG_NAMESPACE)
const debugScreenshot = debugModule(BIDI_SCREENSHOT_DEBUG_NAMESPACE)

type CyCookie = Omit<CyBaseCookie, 'sameSite'> & {
  sameSite: 'no_restriction' | 'lax' | 'strict' | 'unspecified'
}

// if the filter is not an exact match OR, if looselyMatchCookiePath is enabled, doesn't include the path.
// ex: /foo/bar/baz path should include cookies for /foo/bar/baz, /foo/bar, /foo, and /
// this is shipped in remoteTypes within webdriver but it isn't exported, so we need to redefine the type
interface StoragePartialCookie extends Record<string, unknown> {
  name: string
  value: {
    type: 'string'
    value: string
  }
  domain: string
  path: string
  httpOnly: boolean
  hostOnly?: boolean
  secure: boolean
  sameSite: NetworkSameSite | 'default'
  expiry?: number
}

const debugVerbose = debugModule('cypress-verbose:server:browsers:bidi_automation')

// NOTE: these types will eventually be generated automatically via the 'webdriver' package
// Taken from https://fetch.spec.whatwg.org/#request-initiator-type
type RequestInitiatorType = 'audio' | 'beacon' | 'body' | 'css' | 'early-hints' | 'embed' | 'fetch' | 'font' | 'frame' | 'iframe' | 'image' | 'img' | 'input' | 'link' | 'object' | 'ping' | 'script' | 'track' | 'video' | 'xmlhttprequest' | 'other' | null
// Taken from https://fetch.spec.whatwg.org/#concept-request-destination
type RequestDestination = 'audio' | 'audioworklet' | 'document' | 'embed' | 'font' | 'frame' | 'iframe' | 'image' | 'json' | 'manifest' | 'object' | 'paintworklet' | 'report' | 'script' | 'serviceworker' | 'sharedworker' | 'style' | 'track' | 'video' | 'webidentity' | 'worker' | 'xslt' | ''

export type NetworkBeforeRequestSentParametersModified = NetworkBeforeRequestSentParameters & {
  request: {
    destination: RequestDestination
    initiatorType: RequestInitiatorType
  }
}

// maps the network initiator to a ResourceType (which is initially based on CDP).
// This provides us with consistency of types in our request/response middleware, which is important for cy.intercept().
const normalizeResourceType = (type: RequestInitiatorType): ResourceType => {
  switch (type) {
    case 'css':
      return 'stylesheet'
    case 'xmlhttprequest':
      return 'xhr'
    case 'img':
      return 'image'
    case 'iframe':
      return 'document'
      // for types we cannot determine, we can set to other.
    case 'audio':
    case 'beacon':
    case 'body':
    case 'early-hints':
    case 'embed':
    case 'frame':
    case 'input':
    case 'link':
    case 'object':
    case 'track':
    case 'video':
    case null:
      return 'other'
    default:
      return type
  }
}

function convertSameSiteBiDiToExtension (str: NetworkSameSite | 'default') {
  if (str === 'none') {
    return 'no_restriction'
  }

  if (str === 'default') {
    // put firefox version check here, under 140 we need to return 'no_restriction'
    return 'unspecified'
  }

  return str
}

function convertSameSiteExtensionToBiDi (str: CyCookie['sameSite'], majorFirefoxVersion?: number) {
  if (str === 'no_restriction') {
    return 'none'
  }

  if (str === 'unspecified') {
    // put firefox version check here, under 140 we need to return 'no_restriction'
    return 'default'
  }

  // @see https://www.w3.org/TR/webdriver-bidi/#type-network-Cookie
  // in Firefox 140, BiDi added the 'default' value to be able to assign 'unspecified', which was also added in Firefox 140.
  const defaultValue = majorFirefoxVersion && majorFirefoxVersion < 140 ? 'none' : 'default'

  // if no value, default to 'none' as this is the browser default in firefox specifically.
  // Every other browser defaults to 'lax'
  return str === undefined ? defaultValue : str
}

// used to normalize cookies to CyCookie before returning them through the automation client
const convertBiDiCookieToCyCookie = (cookie: NetworkCookie): CyCookie => {
  const cyCookie: CyCookie = {
    name: cookie.name,
    value: cookie.value.value,
    domain: cookie.domain,
    path: cookie.path,
    httpOnly: cookie.httpOnly,
    hostOnly: !!isHostOnlyCookie(cookie),
    expirationDate: cookie.expiry ?? undefined,
    secure: cookie.secure,
    sameSite: convertSameSiteBiDiToExtension(cookie.sameSite),
  }

  debugCookies(`parsed BiDi cookie %o to cy cookie %o`, cookie, cyCookie)

  return cyCookie
}

const convertCyCookieToBiDiCookie = (cookie: CyCookie, majorFirefoxVersion?: number): StoragePartialCookie => {
  const cookieToSet: StoragePartialCookie = {
    name: cookie.name,
    value: {
      type: 'string',
      value: cookie.value,
    },
    domain: cookie.domain,
    path: cookie.path,
    httpOnly: cookie.httpOnly,
    secure: cookie.secure,
    sameSite: convertSameSiteExtensionToBiDi(cookie.sameSite, majorFirefoxVersion),
    // BiDi cookie expiry is in seconds from EPOCH, but sometimes the automation client feeds in a float and BiDi does not know how to handle it.
    // If trying to set a float on the expiry time in BiDi, the setting silently fails.
    expiry: (cookie.expirationDate === -Infinity ? 0 : (isNumber(cookie.expirationDate) ? toInteger(cookie.expirationDate) : null)) ?? undefined,
  }

  if (!cookie.hostOnly && isHostOnlyCookie(cookie)) {
    cookieToSet.domain = `.${cookie.domain}`
  }

  if (cookie.hostOnly && !isHostOnlyCookie(cookie)) {
    cookieToSet.hostOnly = false
  }

  debugCookies(`parsed cy cookie %o to BiDi cookie %o`, cookie, cookieToSet)

  return cookieToSet
}

const buildBiDiClearCookieFilterFromCyCookie = (cookie: CyCookie, majorFirefoxVersion?: number): StoragePartialCookie => {
  const cookieToClearFilter: StoragePartialCookie = {
    name: cookie.name,
    value: {
      type: 'string',
      value: cookie.value,
    },
    domain: cookie.domain,
    path: cookie.path,
    httpOnly: cookie.httpOnly,
    secure: cookie.secure,
    sameSite: convertSameSiteExtensionToBiDi(cookie.sameSite, majorFirefoxVersion),
  }

  if (!cookie.hostOnly && isHostOnlyCookie(cookie)) {
    cookieToClearFilter.domain = `.${cookie.domain}`
  }

  if (cookie.hostOnly && !isHostOnlyCookie(cookie)) {
    cookieToClearFilter.hostOnly = false
  }

  debugCookies(`built filter to clear cookies from cy cookie %o: %o`, cookie, cookieToClearFilter)

  return cookieToClearFilter
}

export class BidiAutomation {
  // events needed to subscribe to in order for our BiDi automation to work properly
  static BIDI_EVENTS = [
    'network.beforeRequestSent',
    'network.responseStarted',
    'network.responseCompleted',
    'network.fetchError',
    'browsingContext.contextCreated',
    'browsingContext.contextDestroyed',
  ]

  private webDriverClient: WebDriverClient
  private automation: Automation
  private autContextId: string | undefined = undefined
  // set in firefox-utils when creating the webdriver session initially and in the 'reset:browser:tabs:for:next:spec' automation hook for subsequent tests when the top level context is recreated
  private topLevelContextId: string | undefined = undefined
  private interceptId: string | undefined = undefined
  private majorFirefoxVersion: number | undefined

  private constructor (webDriverClient: WebDriverClient, automation: Automation) {
    debug('initializing bidi automation')
    this.automation = automation
    this.webDriverClient = webDriverClient
    this.majorFirefoxVersion = parseInt(webDriverClient?.capabilities?.browserVersion || '') || undefined
    // bind Bidi Events to update the standard automation client
    // Error here is expected until webdriver adds initiatorType and destination to the request object
    // @ts-expect-error
    this.webDriverClient.on('network.beforeRequestSent', this.onBeforeRequestSent)
    this.webDriverClient.on('network.responseStarted', this.onResponseStarted)
    this.webDriverClient.on('network.responseCompleted', this.onResponseComplete)
    this.webDriverClient.on('network.fetchError', this.onFetchError)
    this.webDriverClient.on('browsingContext.contextCreated', this.onBrowsingContextCreated)
    this.webDriverClient.on('browsingContext.contextDestroyed', this.onBrowsingContextDestroyed)
  }

  setTopLevelContextId = (contextId?: string) => {
    debug(`setting top level context ID to: ${contextId}`)
    this.topLevelContextId = contextId
  }

  private onBrowsingContextCreated = async (params: BrowsingContextInfo) => {
    debugVerbose('received browsingContext.contextCreated %o', params)
    // the AUT iframe is always the FIRST child created by the top level parent (second is the reporter, if it exists which isnt the case for headless/test replay)
    if (!this.autContextId && params.parent && this.topLevelContextId === params.parent) {
      debug(`new browsing context ${params.context} created within top-level parent context ${params.parent}.`)
      debug(`setting browsing context ${params.context} as the AUT context.`)

      this.autContextId = params.context

      // in the case of top reloads for setting the url between specs, the AUT context gets destroyed but the top level context still exists.
      // in this case, we do NOT have to redefine the top level context intercept but instead update the autContextId to properly identify the
      // AUT in the request interceptor.
      if (!this.interceptId) {
        debugVerbose(`no interceptor defined for top-level context ${params.parent}.`)
        debugVerbose(`creating interceptor to determine if a request belongs to the AUT.`)
        // BiDi can only intercept top level tab contexts (i.e., not iframes), so the intercept needs to be defined on the top level parent, which is the AUTs
        // direct parent in ALL cases. This gets cleaned up in the 'reset:browser:tabs:for:next:spec' automation hook.
        // error looks something like: Error: WebDriver Bidi command "network.addIntercept" failed with error: invalid argument - Context with id 123456789 is not a top-level browsing context
        const { intercept } = await this.webDriverClient.networkAddIntercept({ phases: ['beforeRequestSent'], contexts: [params.parent] })

        debugVerbose(`created network intercept ${intercept} for top-level browsing context ${params.parent}`)

        // save a reference to the intercept ID to be cleaned up in the 'reset:browser:tabs:for:next:spec' automation hook.
        this.interceptId = intercept
      }
    }
  }

  private onBrowsingContextDestroyed = async (params: BrowsingContextInfo) => {
    debugVerbose('received browsingContext.contextDestroyed %o', params)

    // if the top level context gets destroyed, we need to clear the AUT context and destroy the interceptor as it is no longer applicable
    if (params.context === this.topLevelContextId) {
      debug(`top level browsing context ${params.context} destroyed`)
      // if the top level context is destroyed, we can imply that the AUT context is destroyed along with it
      this.autContextId = undefined
      this.setTopLevelContextId(undefined)
      if (this.interceptId) {
        // since we either have:
        //   1. a new upper level browser context created above with shouldKeepTabOpen set to true.
        //   2. all the previous contexts are destroyed.
        // we should clean up our top level interceptor to prevent a memory leak as we no longer need it
        await this.webDriverClient.networkRemoveIntercept({
          intercept: this.interceptId,
        })

        debug(`destroyed network intercept ${this.interceptId}`)

        this.interceptId = undefined
      }
    }

    // if the AUT context is destroyed (possible that the top level context did not), clear the AUT context Id
    if (params.context === this.autContextId) {
      debug(`AUT browsing context ${params.context} destroyed within top-level parent context ${params.parent}.`)

      this.autContextId = undefined
    }
  }

  private onBeforeRequestSent = async (params: NetworkBeforeRequestSentParametersModified) => {
    debugVerbose('received network.beforeRequestSend %o', params)

    let url = params.request.url

    const parsedHeaders = {}

    params.request.headers.forEach((header) => {
      parsedHeaders[header.name] = header.value.value
    })

    const resourceType = normalizeResourceType(params.request.initiatorType)

    const urlWithoutHash = url.includes('#') ? url.substring(0, url.indexOf('#')) : url

    const browserPreRequest: BrowserPreRequest = {
      requestId: params.request.request,
      method: params.request.method,
      // urls coming into the http middleware contain query params, but lack the hash. To get an accurate key to match on the prerequest, we need to remove the hash.
      url: urlWithoutHash,
      headers: parsedHeaders,
      resourceType,
      originalResourceType: params.request.initiatorType || params.request.destination,
      initiator: params.initiator as Protocol.Network.Initiator,
      // Since we are NOT using CDP, we set the values to 0 to indicate that we do not have this information.
      // This is important when determining pre-request timeout and removal behavior
      cdpRequestWillBeSentTimestamp: 0,
      cdpRequestWillBeSentReceivedTimestamp: 0,
    }

    debugVerbose(`prerequest received for request ID ${params.request.request}: %o`, browserPreRequest)
    await this.automation.onBrowserPreRequest?.(browserPreRequest)

    // since all requests coming from the top level context are blocked, we need to continue them here
    // we only want to mutate requests coming from the AUT frame so we can add the X-Cypress-Is-AUT-Frame header
    // so the request-middleware can identify the request

    if (params.isBlocked) {
      params.request.headers.push({
        name: 'X-Cypress-Is-WebDriver-BiDi',
        value: {
          type: 'string',
          value: 'true',
        },
      })

      if (params.context === this.autContextId && resourceType === 'document') {
        debug(`AUT request detected, adding X-Cypress-Is-AUT-Frame for request ID: ${params.request.request}`)

        params.request.headers.push({
          name: 'X-Cypress-Is-AUT-Frame',
          value: {
            type: 'string',
            value: 'true',
          },
        })
      }

      try {
        debug(`continuing request ID: ${params.request.request}`)

        await this.webDriverClient.networkContinueRequest({
          request: params.request.request,
          headers: params.request.headers,
          cookies: params.request.cookies,
        })
      } catch (err: unknown) {
        debugVerbose(`error continuing request: %o`, err)
        debugVerbose(`removing prerequest for request ID: ${params.request.request}`)
        // if the continueRequest fails for any reason, we need to remove the prerequest from the automation client
        this.automation.onRemoveBrowserPreRequest?.(params.request.request)
        // happens if you kill the Cypress app in the middle of request interception. This error can be ignored
        if (!(err as Error)?.message.includes('no such request')) {
          throw err
        }
      }
    }
  }

  private onResponseStarted = (params: NetworkResponseStartedParameters) => {
    debugVerbose('received network.responseStarted %o', params)

    if (params.response.fromCache) {
      this.automation.onRemoveBrowserPreRequest?.(params.request.request)
    }
  }

  private onResponseComplete = (params: NetworkResponseCompletedParameters) => {
    debugVerbose('received network.responseComplete %o', params)

    if (params.response.fromCache) {
      this.automation.onRemoveBrowserPreRequest?.(params.request.request)

      return
    }

    const parsedHeaders = {}

    params.response.headers.forEach((header) => {
      parsedHeaders[header.name] = header.value.value
    })

    const browserResponseReceived: BrowserResponseReceived = {
      requestId: params.request.request,
      status: params.response.status,
      headers: parsedHeaders,
    }

    this.automation.onRequestEvent?.('response:received', browserResponseReceived)
  }

  private onFetchError = (params: NetworkFetchErrorParameters) => {
    debugVerbose('received network.fetchError %o', params)

    this.automation.onRemoveBrowserPreRequest?.(params.request.request)
  }

  private async getAllCookiesMatchingFilter (filter?: {
    name?: string
    domain?: string
    path?: string
    url?: string
  }) {
    let secure: boolean | undefined = undefined

    if (filter?.url) {
      const url = new URL(filter.url)

      filter.domain = url.hostname
      // if we are in a non-secure context, we do NOT want to get secure cookies and apply them,
      // but non-secure cookies can be applied in a secure context.
      if (url.protocol === 'http:') {
        secure = false
      }

      if (url.pathname) {
        filter.path = url.pathname
      }
    }

    /**
     *
     * filter for BiDI storageGetCookies gets the EXACT domain / path of the cookie.
     * Cypress expects all cookies that apply to that domain / path hierarchy to be returned.
     *
     * Domain example:
     * For instance, domain www.foobar.com would have cookies with .foobar.com applied,
     * but sending domain=www.foobar.com to storageGetCookies would not return cookies with .foobar.com domain.
     *
     * Path example
     * For instance, given everything equal except path, given 3 cookies paths:
     * /
     * /cookies
     * /cookies/foo
     *
     *  passing path=/cookies/foo will ONLY return cookies matching the exact path of cookies/foo and not its parent hierarchy
     */
    const BiDiCookieFilter = {
      ...(filter?.name !== undefined ? {
        name: filter.name,
      } : {}),
      ...(secure !== undefined ? {
        secure,
      } : {}),
    }

    const { cookies } = await this.webDriverClient.storageGetCookies({ filter: BiDiCookieFilter })

    debugCookies(`found cookies: %o matching filter: %o`, cookies, BiDiCookieFilter)
    // convert the BiDi Cookies to CyCookies
    const normalizedCookies: CyCookie[] = cookies.map((cookie) => convertBiDiCookieToCyCookie(cookie))

    // because of the above comment on the BiDi API, we get ALL cookies not filtering by domain
    // (name filter is safe to reduce the payload coming back)
    // and filter out all cookies that apply to the given domain, path, and name (which should already be done)
    const filteredCookies = normalizedCookies.filter((cookie) => cookieMatches(cookie as CyBaseCookie, filter))

    debugCookies(`filtered additional cookies based on domain, path, or name: %o`, filteredCookies)

    // print additional information if additional filtering was performed and differs from that returned from BiDi
    if (debugModule.enabled(BIDI_COOKIE_DEBUG_NAMESPACE) && filteredCookies.length !== normalizedCookies.length) {
      debugCookies(`filtered additional cookies based on domain, path, or name: %o`, filteredCookies)
    }

    return filteredCookies
  }

  private async clearCookies (cookie: CyCookie) {
    const {
      domain,
      path,
      name,
    } = cookie
    // get the cookie we are clearing from the BiDi API to make sure it exists
    const cookieToBeCleared = (await this.getAllCookiesMatchingFilter({
      domain,
      path,
      name,
    }))[0]

    debugCookies(`found cookie matching %o filter: %o`, { domain, name, path }, cookieToBeCleared)

    if (!cookieToBeCleared) return

    // if it does, convert it to a BiDi cookie filter and delete the cookie
    await this.webDriverClient.storageDeleteCookies({
      filter: buildBiDiClearCookieFilterFromCyCookie(cookieToBeCleared, this.majorFirefoxVersion) as StorageCookieFilter,
    })

    return cookieToBeCleared
  }

  close () {
    this.webDriverClient.off('network.beforeRequestSent', this.onBeforeRequestSent)
    this.webDriverClient.off('network.responseStarted', this.onResponseStarted)
    this.webDriverClient.off('network.responseCompleted', this.onResponseComplete)
    this.webDriverClient.off('network.fetchError', this.onFetchError)
    this.webDriverClient.off('browsingContext.contextCreated', this.onBrowsingContextCreated)
    this.webDriverClient.off('browsingContext.contextDestroyed', this.onBrowsingContextDestroyed)
  }

  static create (webdriverClient: WebDriverClient, automation: Automation) {
    return new BidiAutomation(webdriverClient, automation)
  }

  public readonly automationMiddleware: AutomationMiddleware = {
    onRequest: async <T extends keyof AutomationCommands> (message: T, data: AutomationCommands[T]['dataType']): Promise<AutomationCommands[T]['returnType']> => {
      debugVerbose('automation command \'%s\' requested with data: %o', message, data)
      debug('BiDi middleware handling msg `%s` for top context %s', message, this.topLevelContextId)
      switch (message) {
        case 'get:cookies':
        {
          debugCookies(`get:cookies %o`, data)
          const cookies = await this.getAllCookiesMatchingFilter(data)

          return cookies
        }

        case 'get:cookie':
        {
          const cookies = await this.getAllCookiesMatchingFilter(data)

          return cookies[0] || null
        }
        case 'set:cookie':
        {
          debugCookies(`set:cookie %o`, data)
          await this.webDriverClient.storageSetCookie({
            cookie: convertCyCookieToBiDiCookie(data, this.majorFirefoxVersion) as BidiStoragePartialCookie,
          })

          const cookies = await this.getAllCookiesMatchingFilter(data)

          return cookies[0] || null
        }

        case 'add:cookies':
          debugCookies(`add:cookies %o`, data)
          await Promise.all(data.map((cookie) => {
            return this.webDriverClient.storageSetCookie({
              cookie: convertCyCookieToBiDiCookie(cookie, this.majorFirefoxVersion) as BidiStoragePartialCookie,
            })
          }))

          return

        case 'set:cookies':

          await this.webDriverClient.storageDeleteCookies({})
          debugCookies(`set:cookies %o`, data)

          await Promise.all(data.map((cookie) => {
            return this.webDriverClient.storageSetCookie({
              cookie: convertCyCookieToBiDiCookie(cookie, this.majorFirefoxVersion) as BidiStoragePartialCookie,
            })
          }))

          return
        case 'clear:cookie':
        {
          debugCookies(`clear:cookie %o`, data)

          const clearedCookie = await this.clearCookies(data)

          return clearedCookie
        }
        case 'clear:cookies':
        {
          debugCookies(`clear:cookies %o`, data)

          const cookiesToBeCleared: CyCookie[] = await Promise.all(data.map(async (cookie: CyCookie) => this.clearCookies(cookie)))

          // clearCookies can return undefined so we filter those values out
          return cookiesToBeCleared.filter(Boolean)
        }
        case 'is:automation:client:connected':
          return true
        case 'take:screenshot':
        {
          const { contexts } = await this.webDriverClient.browsingContextGetTree({})

          const cypressContext = contexts[0].context

          // make sure the main cypress context is focused before taking a screenshot
          await this.webDriverClient.browsingContextActivate({
            context: cypressContext,
          })

          const { data: base64EncodedScreenshot } = await this.webDriverClient.browsingContextCaptureScreenshot({
            context: contexts[0].context,
            format: {
              type: 'png',
            },
          })

          debugScreenshot(`take:screenshot base64 encoded value of context %s: %s`, contexts[0].context, base64EncodedScreenshot)

          return `data:image/png;base64,${base64EncodedScreenshot}`
        }

        case 'reset:browser:state':
          // FIXME: patch this for now just to get clean cookies between tests
          // we really need something similar to the Storage.clearDataForOrigin and Network.clearBrowserCache methods here.

          // For now we can forward to the web extension or the web extension https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/browsingData/remove API
          debug('reset:browser:state')
          // await this.webDriverClient.storageDeleteCookies({})
          // to accomplish this, we will throw an AutomationNotImplemented error to let the web extension handle it.
          throw new AutomationNotImplemented(message, 'BiDiAutomation')
        case 'reset:browser:tabs:for:next:spec':
          {
            const { contexts } = await this.webDriverClient.browsingContextGetTree({})

            if (data.shouldKeepTabOpen) {
              // create a new context for the next spec to run
              const { context } = await this.webDriverClient.browsingContextCreate({
                type: 'tab',
              })

              debug(`reset:browser:tabs:for:next:spec shouldKeepTabOpen=true. Created new context: %s`, context)
            }

            // CLOSE ALL BUT THE NEW CONTEXT, which makes it active
            // also do not need to navigate to about:blank as this happens by default
            for (const context of contexts) {
              debug(`reset:browser:tabs:for:next:spec closing context: %s`, context.context)

              await this.webDriverClient.browsingContextClose({
                context: context.context,
              })
            }
          }

          return
        case 'focus:browser:window':
          {
            const { contexts } = await this.webDriverClient.browsingContextGetTree({})

            // TODO: just focus the AUT context window that we already have as opposed to the zero-ith frame
            const cypressContext = contexts[0].context

            await this.webDriverClient.browsingContextActivate({
              context: cypressContext,
            })

            debug(`focus:browser:window focused context: %s`, cypressContext)
          }

          return
        case 'key:press':
          if (this.autContextId) {
            debug(`key:press %s`, data.key)
            await bidiKeyPress(toSupportedKey(data.key), this.webDriverClient, this.autContextId, this.topLevelContextId)
          } else {
            throw new Error('Cannot emit key press: no AUT context initialized')
          }

          return
        case 'get:aut:url':
        {
          if (this.autContextId) {
            return bidiGetUrl(this.webDriverClient, this.autContextId)
          }

          throw new Error('Cannot get AUT url: no AUT context initialized')
        }

        case 'reload:aut:frame':
        {
          if (this.autContextId) {
            await bidiReloadFrame(this.webDriverClient, this.autContextId, data.forceReload)

            return
          }

          throw new Error('Cannot reload AUT frame: no AUT context initialized')
        }
        case 'navigate:aut:history':
        {
          if (this.autContextId) {
            await bidiNavigateHistory(this.webDriverClient, this.autContextId, data.historyNumber)

            return
          }

          throw new Error('Cannot navigate AUT frame history: no AUT context initialized')
        }
        case 'get:aut:title':
        {
          if (this.autContextId) {
            return bidiGetFrameTitle(this.webDriverClient, this.autContextId)
          }

          throw new Error('Cannot get AUT title no AUT context initialized')
        }
        default:
          debug('BiDi automation not implemented for message: %s', message)
          throw new AutomationNotImplemented(message, 'BiDiAutomation')
      }
    },
  }
}
