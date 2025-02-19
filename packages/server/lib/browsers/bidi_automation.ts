import debugModule from 'debug'
import type { Automation } from '../automation'
import type { BrowserPreRequest, BrowserResponseReceived, ResourceType } from '@packages/proxy'
import type { Client as WebDriverClient } from 'webdriver'
import type {
  NetworkBeforeRequestSentParameters,
  NetworkResponseStartedParameters,
  NetworkResponseCompletedParameters,
  NetworkFetchErrorParameters,
  BrowsingContextInfo,
} from 'webdriver/build/bidi/localTypes'
const debug = debugModule('cypress:server:browsers:bidi_automation')
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

  private constructor (webDriverClient: WebDriverClient, automation: Automation) {
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

    const browserPreRequest: BrowserPreRequest = {
      requestId: params.request.request,
      method: params.request.method,
      url,
      headers: parsedHeaders,
      resourceType,
      originalResourceType: params.request.initiatorType || params.request.destination,
      initiator: params.initiator,
      // Since we are NOT using CDP, we set the values to -1 to indicate that we do not have this information.
      cdpRequestWillBeSentTimestamp: -1,
      cdpRequestWillBeSentReceivedTimestamp: -1,
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
}
