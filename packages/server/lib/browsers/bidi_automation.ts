import debugModule from 'debug'
import { isLocalhost } from '@packages/network-tools'
import { cookieMatches, isHostOnlyCookie } from '../automation/cookie/util'
import { convertBiDiCookieToCyCookie, convertCyCookieToBiDiCookie, convertSameSiteExtensionToBiDi } from '../automation/cookie/converters/bidi'
import { bidiKeyPress } from '../automation/commands/key_press'
import { AutomationNotImplemented } from '../automation/automation_not_implemented'

import type Protocol from 'devtools-protocol'
import type { Automation } from '../automation'
import type { BrowserPreRequest, BrowserResponseReceived, ResourceType } from '@packages/proxy'
import type { AutomationMiddleware, AutomationCommands } from '@packages/types'
import { toSupportedKey, AUT_FRAME_NAME_IDENTIFIER } from '@packages/types'
import type { Client as WebDriverClient } from 'webdriver'
import type {
  NetworkBeforeRequestSentParameters,
  NetworkResponseStartedParameters,
  NetworkResponseCompletedParameters,
  NetworkFetchErrorParameters,
  BrowsingContextInfo,
} from 'webdriver/build/bidi/localTypes'
import type { CyCookie as CyBaseCookie } from '../automation/cookie/util'
import type { BidiCyCookie as CyCookie, StoragePartialCookie } from '../automation/cookie/converters/bidi'
import { bidiGetUrl } from '../automation/commands/get_url'
import { bidiReloadFrame } from '../automation/commands/reload_frame'
import { bidiNavigateHistory } from '../automation/commands/navigate_history'
import { bidiGetFrameTitle } from '../automation/commands/get_frame_title'
import { bidiPerformUserGesture } from '../automation/commands/user_gesture'
import { AUT_FRAME_HEADER } from './constants'
import type { StorageCookieFilter, StoragePartialCookie as BidiStoragePartialCookie } from 'webdriver/build/bidi/remoteTypes'

const BIDI_DEBUG_NAMESPACE = 'cypress:server:browsers:bidi_automation'
const BIDI_COOKIE_DEBUG_NAMESPACE = `${BIDI_DEBUG_NAMESPACE}:cookies`
const BIDI_SCREENSHOT_DEBUG_NAMESPACE = `${BIDI_DEBUG_NAMESPACE}:screenshot`

const debug = debugModule(BIDI_DEBUG_NAMESPACE)
const debugCookies = debugModule(BIDI_COOKIE_DEBUG_NAMESPACE)
const debugScreenshot = debugModule(BIDI_SCREENSHOT_DEBUG_NAMESPACE)

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

const buildBiDiClearCookieFilterFromCyCookie = (cookie: CyCookie): StoragePartialCookie => {
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
    sameSite: convertSameSiteExtensionToBiDi(cookie.sameSite),
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
  private autContextDeferred: PromiseWithResolvers<string> | undefined = undefined
  private autContextRecovery: Promise<string | undefined> | undefined = undefined
  // autContextId is unset while an identification's window.name read is in
  // flight, so the match-based clear in onBrowsingContextDestroyed cannot catch
  // a destroy of the candidate frame itself; these entries let the destroy mark
  // the identification stale so a dead frame is never recorded.
  private inFlightIdentifications = new Set<{ contextId: string, destroyed: boolean }>()
  // AUT context identification needs a scriptEvaluate round trip, and reloads /
  // navigations destroy and recreate the context, so an AUT-dependent automation
  // request can legitimately arrive while no context is tracked. Requests wait
  // up to this long for the context to (re)resolve before failing (#34705).
  // Instance fields rather than constants so unit tests can shrink the wait.
  private autContextResolveTimeoutMs = 4000
  private autContextPollIntervalMs = 250

  private constructor (webDriverClient: WebDriverClient, automation: Automation) {
    debug('initializing bidi automation')
    this.automation = automation
    this.webDriverClient = webDriverClient
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
    debug('received browsingContext.contextCreated %o', params)

    // Only direct children of the top-level context are candidates for the AUT.
    if (this.autContextId || !params.parent || this.topLevelContextId !== params.parent) {
      return
    }

    await this.identifyAndSetAutContext(params.context, params.parent)
  }

  private setAndResolveAutContextId (contextId: string) {
    this.autContextId = contextId
    this.autContextDeferred?.resolve(contextId)
    this.autContextDeferred = undefined
  }

  // A promise that settles when the AUT context is (re)identified, shared by
  // every request waiting on it and re-armed after each resolution.
  private whenAutContextResolves (): Promise<string> {
    if (this.autContextId) {
      return Promise.resolve(this.autContextId)
    }

    if (!this.autContextDeferred) {
      this.autContextDeferred = Promise.withResolvers<string>()
      // The rejection on top-level destroy must not crash the process when no
      // request happens to be awaiting the promise at that moment.
      this.autContextDeferred.promise.catch(() => {})
    }

    return this.autContextDeferred.promise
  }

  // Determines whether `contextId` is the AUT iframe and records it if so.
  // Shared by the contextCreated event and the on-demand recovery path in
  // ensureAutContextId. Returns true when the context was the AUT.
  private identifyAndSetAutContext = async (contextId: string, parentContextId: string): Promise<boolean> => {
    // The top-level context has more than one direct child iframe — the AUT and
    // the reporter iframe — and their creation order is not guaranteed, so
    // identify the AUT by its window.name (seeded with AUT_FRAME_NAME_IDENTIFIER
    // for exactly this purpose) rather than assuming it is the first child
    // created.
    let contextName = ''

    const identification = { contextId, destroyed: false }

    this.inFlightIdentifications.add(identification)

    try {
      contextName = (await this.webDriverClient.scriptEvaluate({
        expression: 'window.name',
        target: { context: contextId },
        awaitPromise: false,
        // @ts-expect-error - result is not typed
      }))?.result?.value ?? ''
    } catch (err) {
      debug(`could not read window.name for browsing context ${contextId}; skipping AUT identification for it: %o`, err)

      return false
    } finally {
      this.inFlightIdentifications.delete(identification)
    }

    if (!contextName.startsWith(AUT_FRAME_NAME_IDENTIFIER)) {
      debug(`browsing context ${contextId} (name: '${contextName}') is not the AUT; skipping.`)

      return false
    }

    // The window.name read yields; if the frame itself was destroyed while it
    // was in flight, this identification is for a dead frame and must not be
    // recorded.
    if (identification.destroyed) {
      debug(`browsing context ${contextId} was destroyed while being identified; discarding.`)

      return false
    }

    // Likewise if the top-level context changed or was destroyed during the
    // read, this identification belongs to a dead tab.
    if (this.topLevelContextId !== parentContextId) {
      debug(`browsing context ${contextId} was identified against a stale top-level context ${parentContextId}; discarding.`)

      return false
    }

    // The event path and the on-demand recovery path can identify concurrently
    // (the window.name read yields); the first one to finish wins.
    if (this.autContextId) {
      return this.autContextId === contextId
    }

    debug(`browsing context ${contextId} (name: '${contextName}') identified within top-level parent context ${parentContextId}.`)
    debug(`setting browsing context ${contextId} as the AUT context.`)

    this.setAndResolveAutContextId(contextId)

    // in the case of top reloads for setting the url between specs, the AUT context gets destroyed but the top level context still exists.
    // in this case, we do NOT have to redefine the top level context intercept but instead update the autContextId to properly identify the
    // AUT in the request interceptor.
    if (!this.interceptId) {
      debug(`no interceptor defined for top-level context ${parentContextId}.`)
      debug(`creating interceptor to determine if a request belongs to the AUT.`)
      // BiDi can only intercept top level tab contexts (i.e., not iframes), so the intercept needs to be defined on the top level parent, which is the AUTs
      // direct parent in ALL cases. This gets cleaned up in the 'reset:browser:tabs:for:next:spec' automation hook.
      // error looks something like: Error: WebDriver Bidi command "network.addIntercept" failed with error: invalid argument - Context with id 123456789 is not a top-level browsing context
      const { intercept } = await this.webDriverClient.networkAddIntercept({ phases: ['beforeRequestSent'], contexts: [parentContextId] })

      debug(`created network intercept ${intercept} for top-level browsing context ${parentContextId}`)

      // save a reference to the intercept ID to be cleaned up in the 'reset:browser:tabs:for:next:spec' automation hook.
      this.interceptId = intercept
    }

    return true
  }

  // A contextCreated event can be missed for good: it can arrive before
  // setTopLevelContextId records its parent, and its window.name read can fail
  // while the frame is mid-navigation. Nothing replays those events, so
  // re-derive the AUT from the live context tree instead. Concurrent callers
  // share one in-flight recovery.
  private recoverAutContextFromTree = (): Promise<string | undefined> => {
    this.autContextRecovery ??= this.queryTreeForAutContext().finally(() => {
      this.autContextRecovery = undefined
    })

    return this.autContextRecovery
  }

  // When a top-level context exists but no AUT context is tracked, the AUT
  // iframe may well be live with its identification unobserved (see
  // recoverAutContextFromTree) — so re-derive it: walk the top-level context's
  // direct children in the live tree and identify the AUT by its window.name,
  // exactly as the contextCreated event path would have.
  private queryTreeForAutContext = async (): Promise<string | undefined> => {
    const topLevelContextId = this.topLevelContextId

    if (this.autContextId || !topLevelContextId) {
      return this.autContextId
    }

    try {
      const { contexts } = await this.webDriverClient.browsingContextGetTree({ root: topLevelContextId })
      const children = contexts?.[0]?.children ?? []

      for (const child of children) {
        if (await this.identifyAndSetAutContext(child.context, topLevelContextId)) {
          return this.autContextId
        }
      }
    } catch (err) {
      debug('could not recover the AUT context from the browsing context tree: %o', err)
    }

    return undefined
  }

  // Resolves the AUT context for an automation request, tolerating the windows
  // where none is tracked: the identification round trip after contextCreated,
  // the gap between a context being destroyed and recreated (reloads, top
  // navigations, spec transitions), and missed contextCreated events.
  private ensureAutContextId = async (failureMessage: string): Promise<string> => {
    if (this.autContextId) {
      return this.autContextId
    }

    // With no top-level context there is no tab to wait on or recover from.
    if (!this.topLevelContextId) {
      throw new Error(failureMessage)
    }

    // Subscribe before kicking off recovery so an identification that lands
    // immediately still settles the race below.
    const contextResolved = this.whenAutContextResolves()

    // Wait for the AUT context id to be regrabbed — either the contextCreated
    // event path identifies it or one of the recovery attempts re-derives it
    // from the live tree (a successful recovery settles contextResolved via
    // setAndResolveAutContextId) — for at most autContextResolveTimeoutMs. If
    // nothing lands in time, or the top-level context is destroyed while
    // waiting, throw. Recovery attempts are deliberately not awaited so a hung
    // tree query cannot hold a request past the bound.
    void this.recoverAutContextFromTree()
    const recoveryInterval = setInterval(() => {
      void this.recoverAutContextFromTree()
    }, this.autContextPollIntervalMs)
    let timeout!: NodeJS.Timeout

    try {
      const contextId = await Promise.race([
        contextResolved,
        new Promise<undefined>((resolve) => {
          timeout = setTimeout(() => resolve(undefined), this.autContextResolveTimeoutMs)
        }),
      ])

      if (contextId) {
        return contextId
      }
    } catch (err) {
      debug('stopped waiting for the AUT context: %o', err)
    } finally {
      clearInterval(recoveryInterval)
      clearTimeout(timeout)
    }

    throw new Error(failureMessage)
  }

  private onBrowsingContextDestroyed = async (params: BrowsingContextInfo) => {
    debugVerbose('received browsingContext.contextDestroyed %o', params)

    // A frame with an identification round trip in flight has no autContextId
    // to match against below, so mark the identification stale directly.
    for (const identification of this.inFlightIdentifications) {
      if (identification.contextId === params.context) {
        identification.destroyed = true
      }
    }

    // if the top level context gets destroyed, we need to clear the AUT context and destroy the interceptor as it is no longer applicable
    if (params.context === this.topLevelContextId) {
      debug(`top level browsing context ${params.context} destroyed`)
      // if the top level context is destroyed, we can imply that the AUT context is destroyed along with it
      this.autContextId = undefined
      // Fail any requests still waiting on an AUT context: the tab they belong
      // to is gone, and the AUT of a subsequently created tab must not satisfy
      // them.
      this.autContextDeferred?.reject(new Error(`top-level browsing context ${params.context} was destroyed`))
      this.autContextDeferred = undefined
      this.setTopLevelContextId(undefined)
      if (this.interceptId) {
        const interceptToRemove = this.interceptId

        // Clear state up-front so the field stays consistent regardless of how the BiDi call resolves.
        this.interceptId = undefined

        // since we either have:
        //   1. a new upper level browser context created above with shouldKeepTabOpen set to true.
        //   2. all the previous contexts are destroyed.
        // we should clean up our top level interceptor to prevent a memory leak as we no longer need it.
        //
        // On Firefox 144 BiDi, network.removeIntercept can race with the browsingContext.close
        // that just destroyed the context owning this intercept and never ack — which kills the
        // automation socket and aborts the run. Cap the wait so a wedged server can't take us down.
        try {
          await Promise.race([
            this.webDriverClient.networkRemoveIntercept({ intercept: interceptToRemove }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('networkRemoveIntercept timed out (best-effort cleanup)')), 2000)),
          ])

          debug(`destroyed network intercept ${interceptToRemove}`)
        } catch (err) {
          debug(`networkRemoveIntercept best-effort cleanup failed for ${interceptToRemove}: %s`, (err as Error).message)
        }
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
          name: AUT_FRAME_HEADER,
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
      //
      // localhost and the loopback range (127.0.0.0/8, ::1) are "potentially
      // trustworthy" origins, so browsers treat them as secure contexts and
      // still send secure cookies over http for those hosts. Firefox has done
      // this since Firefox 75 (see https://bugzilla.mozilla.org/show_bug.cgi?id=1618113
      // and https://bugzilla.mozilla.org/show_bug.cgi?id=1648993), matching the
      // Chromium/CDP behavior in getCookiesByUrl. Exclude those hosts from the
      // secure filter so cy.request receives the same cookies the browser would.
      // @see https://github.com/cypress-io/cypress/pull/34095 for the full rationale.
      if (url.protocol === 'http:' && !isLocalhost(url)) {
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
      filter: buildBiDiClearCookieFilterFromCyCookie(cookieToBeCleared) as StorageCookieFilter,
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
            cookie: convertCyCookieToBiDiCookie(data) as BidiStoragePartialCookie,
          })

          const cookies = await this.getAllCookiesMatchingFilter(data)

          return cookies[0] || null
        }

        case 'add:cookies':
          debugCookies(`add:cookies %o`, data)
          await Promise.all(data.map((cookie) => {
            return this.webDriverClient.storageSetCookie({
              cookie: convertCyCookieToBiDiCookie(cookie) as BidiStoragePartialCookie,
            })
          }))

          return

        case 'set:cookies':

          await this.webDriverClient.storageDeleteCookies({})
          debugCookies(`set:cookies %o`, data)

          await Promise.all(data.map((cookie) => {
            return this.webDriverClient.storageSetCookie({
              cookie: convertCyCookieToBiDiCookie(cookie) as BidiStoragePartialCookie,
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
        {
          const autContextId = await this.ensureAutContextId('Cannot emit key press: no AUT context initialized')

          debug(`key:press %s`, data.key)
          await bidiKeyPress(toSupportedKey(data.key), this.webDriverClient, autContextId, this.topLevelContextId)

          return
        }
        case 'perform:user:gesture':
          // Firefox 93+ requires a transient user activation before display capture is allowed,
          // which the driver needs in order to record video via getUserMedia. We grant it by
          // synthesizing a trusted gesture in the top-level context (where getUserMedia is called).
          // @see https://github.com/cypress-io/cypress/issues/18415
          if (this.topLevelContextId) {
            await bidiPerformUserGesture(this.webDriverClient, this.topLevelContextId)
          } else {
            throw new Error('Cannot perform user gesture: no top-level context initialized')
          }

          return
        case 'get:aut:url':
        {
          const autContextId = await this.ensureAutContextId('Cannot get AUT url: no AUT context initialized')

          return bidiGetUrl(this.webDriverClient, autContextId)
        }

        case 'reload:aut:frame':
        {
          const autContextId = await this.ensureAutContextId('Cannot reload AUT frame: no AUT context initialized')

          await bidiReloadFrame(this.webDriverClient, autContextId, data.forceReload)

          return
        }
        case 'navigate:aut:history':
        {
          const autContextId = await this.ensureAutContextId('Cannot navigate AUT frame history: no AUT context initialized')

          await bidiNavigateHistory(this.webDriverClient, autContextId, data.historyNumber)

          return
        }
        case 'get:aut:title':
        {
          const autContextId = await this.ensureAutContextId('Cannot get AUT title no AUT context initialized')

          return bidiGetFrameTitle(this.webDriverClient, autContextId)
        }
        default:
          debug('BiDi automation not implemented for message: %s', message)
          throw new AutomationNotImplemented(message, 'BiDiAutomation')
      }
    },
  }
}
