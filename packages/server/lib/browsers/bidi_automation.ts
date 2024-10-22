import debugModule from 'debug'
import type { Automation } from '../automation'
import type { BrowserPreRequest, BrowserResponseReceived } from '@packages/proxy'
import type { Client as WebDriverClient } from 'webdriver'
import type {
  NetworkBeforeRequestSentParameters,
  NetworkResponseStartedParameters,
  NetworkResponseCompletedParameters,
  NetworkFetchErrorParameters,
  NetworkInitiator,
  ScriptRealmDestroyedParameters,
  ScriptRealmInfo,
  BrowsingContextInfo,
} from 'webdriver/build/bidi/localTypes'

const debugVerbose = debugModule('cypress-verbose:server:browsers:bidi_automation')

const normalizeResourceType = (type: NetworkInitiator['type']) => {
  return type === 'parser' ? 'other' : type
}

export class BidiAutomation {
  // events needed to subscribe to in order for our BiDi automation to work properly
  static BIDI_EVENTS = [
    'network.beforeRequestSent',
    'network.responseStarted',
    'network.responseCompleted',
    'network.fetchError',
    'script.realmCreated',
    'script.realmDestroyed',
    'browsingContext.contextCreated',
    'browsingContext.contextDestroyed',
  ]
  private webDriverClient: WebDriverClient
  private automation: Automation
  private cachedDataUrlRequestIds: Set<string> = new Set()
  private AUTContextId: string | undefined = undefined
  // set in firefox-utils when creating the webdriver session initially and in the 'reset:browser:tabs:for:next:spec' automation hook for subsequent tests when the top level context is recreated
  private topLevelContextId: string | undefined = undefined
  private interceptId: string | undefined = undefined

  private constructor (webDriverClient: WebDriverClient, automation: Automation) {
    this.automation = automation
    this.webDriverClient = webDriverClient

    // bind Bidi Events to update the standard automation client
    this.webDriverClient.on('network.beforeRequestSent', this.onBeforeRequestSent.bind(this))
    this.webDriverClient.on('network.responseStarted', this.onResponseStarted.bind(this))
    this.webDriverClient.on('network.responseCompleted', this.onResponseComplete.bind(this))
    this.webDriverClient.on('network.fetchError', this.onFetchError.bind(this))
    this.webDriverClient.on('script.realmCreated', this.onRealmCreated.bind(this))
    this.webDriverClient.on('script.realmDestroyed', this.onRealmDestroyed.bind(this))
    this.webDriverClient.on('browsingContext.contextCreated', this.onBrowsingContextCreated.bind(this))
    this.webDriverClient.on('browsingContext.contextDestroyed', this.onBrowsingContextDestroyed.bind(this))
  }

  setTopLevelContextId (contextId?: string) {
    debugVerbose(`setting top level context ID to: ${contextId}`)
    this.topLevelContextId = contextId
  }

  private async onBrowsingContextCreated (params: BrowsingContextInfo) {
    // the AUT iframe is always the FIRST child created by the top level parent (second is the reporter, if it exists which isnt the case for headless/test replay)
    if (!this.AUTContextId && params.parent && this.topLevelContextId === params.parent) {
      debugVerbose(`new browsing context ${params.context} created within top-level parent context ${params.parent}.`)
      debugVerbose(`setting browsing context ${params.context} as the AUT context.`)

      this.AUTContextId = params.context

      // in the case of top reloads for setting the url between specs, the AUT context gets destroyed but the top level context still exists.
      // in this case, we do NOT have to redefined the top level context intercept but instead update the AUTContextId to properly identify the
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

  private async onBrowsingContextDestroyed (params: BrowsingContextInfo) {
    // if the top level context gets destroyed, we need to clear the AUT context and destroy the interceptor as it is no longer applicable
    if (params.context === this.topLevelContextId) {
      debugVerbose(`top level browsing context ${params.context} destroyed`)
      if (this.interceptId) {
        // since we either have:
        //   1. a new upper level browser context created above with shouldKeepTabOpen set to true.
        //   2. all the previous contexts are destroyed.
        // we should clean up our top level interceptor to prevent a memory leak as we no longer need it
        await this.webDriverClient.networkRemoveIntercept({
          intercept: this.interceptId,
        })

        debugVerbose(`destroyed network intercept ${this.interceptId} for top-level browsing context ${params.parent}`)

        this.interceptId = undefined
      }

      this.setTopLevelContextId(undefined)
    }

    // if the AUT context is destroyed (possible that the top level context did not), clear the AUT context Id
    if (params.context === this.AUTContextId) {
      debugVerbose(`AUT browsing context ${params.context} destroyed within top-level parent context ${params.parent}.`)

      this.AUTContextId = undefined
    }
  }

  // CDP equivalent: Network.requestWillBeSent
  private async onBeforeRequestSent (params: NetworkBeforeRequestSentParameters) {
    debugVerbose('received network.beforeRequestSend %o', params)

    let url = params.request.url

    // TODO: need to see if this is still relevant in BiDi
    if (url.includes('#')) url = url.slice(0, url.indexOf('#'))

    if (url.startsWith('data:')) {
      debugVerbose('skipping data: url %s', url)
      this.cachedDataUrlRequestIds.add(params.request.request)

      return
    }

    const parsedHeaders = {}

    params.request.headers.forEach((header) => {
      parsedHeaders[header.name] = header.value.value
    })

    const browserPreRequest: BrowserPreRequest = {
      requestId: params.request.request,
      method: params.request.method,
      url,
      headers: parsedHeaders,
      resourceType: normalizeResourceType(params.initiator.type),
      originalResourceType: params.initiator.type,
      initiator: params.initiator,
    }

    debugVerbose(`prerequest received for request ID ${params.request.request}: %o`, browserPreRequest)
    await this.automation.onBrowserPreRequest?.(browserPreRequest)

    // since all requests coming from the top level context are blocked, we need to continue them here
    // we only want to mutate requests coming from the AUT frame so we can add the X-Cypress-Is-AUT-Frame header
    // so the request-middleware can identify the request

    if (params.isBlocked) {
      if (params.context === this.AUTContextId) {
        debugVerbose(`AUT request detected, adding X-Cypress-Is-AUT-Frame for request ID: ${params.request.request}`)

        params.request.headers.push({
          name: 'X-Cypress-Is-AUT-Frame',
          value: {
            type: 'string',
            value: 'true',
          },
        })
      }

      try {
        debugVerbose(`continuing request ID: ${params.request.request}`)

        await this.webDriverClient.networkContinueRequest({
          request: params.request.request,
          headers: params.request.headers,
          cookies: params.request.cookies,
        })
      } catch (e) {
        // happens if you kill the Cypress app in the middle of request interception. This error can be ignored
        if (!e.message.includes('no such request')) {
          throw e
        }
      }
    }
  }

  // CDP equivalent: contains information to infer Network.requestServedFromCache
  private onResponseStarted (params: NetworkResponseStartedParameters) {
    debugVerbose('received network.responseStarted %o', params)

    if (params.response.fromCache) {
    // Filter out "data:" urls; they don't have a stored browserPreRequest
    // since they're not actually fetched
      if (this.cachedDataUrlRequestIds.has(params.request.request)) {
        this.cachedDataUrlRequestIds.delete(params.request.request)
        debugVerbose('skipping data: request %s', params.request.request)

        return
      }

      this.automation.onRemoveBrowserPreRequest?.(params.request.request)
    }
  }

  // CDP equivalent: Network.responseReceived
  private onResponseComplete (params: NetworkResponseCompletedParameters) {
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

  // CDP equivalent: Network.loadingFailed
  private onFetchError (params: NetworkFetchErrorParameters) {
    debugVerbose('received network.fetchError %o', params)

    this.automation.onRemoveBrowserPreRequest?.(params.request.request)
  }

  // CDP equivalent: trying to determine ServiceWorker.workerRegistrationUpdated
  private onRealmCreated (params: ScriptRealmInfo) {
    debugVerbose('received script.realmCreated %o', params)
    //  this.automation.onServiceWorkerRegistrationUpdated?.(params)
  }

  // CDP equivalent: trying to determine ServiceWorker.workerVersionUpdated
  private onRealmDestroyed (params: ScriptRealmDestroyedParameters) {
    debugVerbose('received script.realmDestroyed %o', params)
  }

  close () {
    this.webDriverClient.off('network.beforeRequestSent', this.onBeforeRequestSent.bind(this))
    this.webDriverClient.off('network.responseStarted', this.onResponseStarted.bind(this))
    this.webDriverClient.off('network.responseCompleted', this.onResponseComplete.bind(this))
    this.webDriverClient.off('network.fetchError', this.onFetchError.bind(this))
    this.webDriverClient.off('script.realmCreated', this.onRealmCreated.bind(this))
    this.webDriverClient.off('script.realmDestroyed', this.onRealmDestroyed.bind(this))
    this.webDriverClient.off('browsingContext.contextCreated', this.onBrowsingContextCreated.bind(this))
    this.webDriverClient.off('browsingContext.contextDestroyed', this.onBrowsingContextDestroyed.bind(this))
  }

  static create (webdriverClient: WebDriverClient, automation: Automation) {
    return new BidiAutomation(webdriverClient, automation)
  }
}
