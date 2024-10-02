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
} from 'webdriver/build/bidi/localTypes'

const debugVerbose = debugModule('cypress-verbose:server:browsers:bidi_automation')

const normalizeResourceType = (type: NetworkInitiator['type']) => {
  return type === 'parser' ? 'other' : type
}

export class BidiAutomation {
  #webDriverClient: WebDriverClient
  #automation: Automation
  #cachedDataUrlRequestIds: Set<string> = new Set()

  constructor (webDriverClient: WebDriverClient, automation: Automation) {
    this.#automation = automation
    this.#webDriverClient = webDriverClient

    // bind Bidi Events to update the standard automation client
    this.#webDriverClient.on('network.beforeRequestSent', this.onBeforeRequestSent.bind(this))
    this.#webDriverClient.on('network.responseStarted', this.onResponseStarted.bind(this))
    this.#webDriverClient.on('network.responseCompleted', this.onResponseComplete.bind(this))
    this.#webDriverClient.on('network.fetchError', this.onFetchError.bind(this))
    this.#webDriverClient.on('script.realmCreated', this.onRealmCreated.bind(this))
    this.#webDriverClient.on('script.realmDestroyed', this.onRealmDestroyed.bind(this))
  }

  // CDP equivalent: Network.requestWillBeSent
  private async onBeforeRequestSent (params: NetworkBeforeRequestSentParameters) {
    debugVerbose('received network.beforeRequestSend %o', params)

    let url = params.request.url

    // TODO: need to see if this is still relevant
    if (url.includes('#')) url = url.slice(0, url.indexOf('#'))

    if (url.startsWith('data:')) {
      debugVerbose('skipping data: url %s', url)
      this.#cachedDataUrlRequestIds.add(params.request.request)

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

    await this.#automation.onBrowserPreRequest?.(browserPreRequest)
  }

  // CDP equivalent: contains information to infer Network.requestServedFromCache
  private onResponseStarted (params: NetworkResponseStartedParameters) {
    debugVerbose('received network.responseStarted %o', params)

    if (params.response.fromCache) {
    // Filter out "data:" urls; they don't have a stored browserPreRequest
    // since they're not actually fetched
      if (this.#cachedDataUrlRequestIds.has(params.request.request)) {
        this.#cachedDataUrlRequestIds.delete(params.request.request)
        debugVerbose('skipping data: request %s', params.request.request)

        return
      }

      this.#automation.onRemoveBrowserPreRequest?.(params.request.request)
    }
  }

  // CDP equivalent: Network.responseReceived
  private onResponseComplete (params: NetworkResponseCompletedParameters) {
    debugVerbose('received network.responseComplete %o', params)

    if (params.response.fromCache) {
      this.#automation.onRemoveBrowserPreRequest?.(params.request.request)

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

    this.#automation.onRequestEvent?.('response:received', browserResponseReceived)
  }

  // CDP equivalent: Network.loadingFailed
  private onFetchError (params: NetworkFetchErrorParameters) {
    debugVerbose('received network.fetchError %o', params)

    this.#automation.onRemoveBrowserPreRequest?.(params.request.request)
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
    this.#webDriverClient.off('network.beforeRequestSent', this.onBeforeRequestSent.bind(this))
    this.#webDriverClient.off('network.responseStarted', this.onResponseStarted.bind(this))
    this.#webDriverClient.off('network.responseCompleted', this.onResponseComplete.bind(this))
    this.#webDriverClient.off('network.fetchError', this.onFetchError.bind(this))
    this.#webDriverClient.off('script.realmCreated', this.onRealmCreated.bind(this))
    this.#webDriverClient.off('script.realmDestroyed', this.onRealmDestroyed.bind(this))
  }
}
