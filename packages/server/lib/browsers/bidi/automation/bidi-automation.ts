import debugModule from 'debug'
import * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js'
import { BidiSocket } from '../sockets/bidi-socket'
import { BrowsingContextModule } from './modules/browsing-context'
import { InputModule } from './modules/input'
import { LogModule } from './modules/log'
import { NetworkModule } from './modules/network'
import { ScriptModule } from './modules/script'
import { SessionModule } from './modules/session'
import { StorageModule } from './modules/storage'
import type { Automation } from '../../../automation'
import type { BrowserPreRequest, BrowserResponseReceived } from '@packages/proxy'

const debugVerbose = debugModule('cypress-verbose:server:browsers:bidi:automation')

const normalizeResourceType = (type: Bidi.Network.Initiator['type']) => {
  return type === 'parser' ? 'other' : type
}

export class BidiAutomation {
  browsingContext: BrowsingContextModule
  input: InputModule
  log: LogModule
  network: NetworkModule
  session: SessionModule
  script: ScriptModule
  storage: StorageModule
  #automation: Automation
  #cachedDataUrlRequestIds: Set<string> = new Set()

  private constructor ({
    browsingContextModule,
    inputModule,
    logModule,
    networkModule,
    sessionModule,
    scriptModule,
    storageModule,
  }: {
    browsingContextModule: BrowsingContextModule
    inputModule: InputModule
    logModule: LogModule
    networkModule: NetworkModule
    sessionModule: SessionModule
    scriptModule: ScriptModule
    storageModule: StorageModule
  }, automation: Automation) {
    this.#automation = automation
    this.browsingContext = browsingContextModule
    this.input = inputModule
    this.log = logModule
    this.network = networkModule
    this.session = sessionModule
    this.script = scriptModule
    this.storage = storageModule

    // bind Bidi Events to update the standard automation client
    this.network.onBeforeRequestSent(({ params }) => this.onBeforeRequestSent(params))
    this.network.onResponseStarted(({ params }) => this.onResponseStarted(params))
    this.network.onResponseComplete(({ params }) => this.onResponseComplete(params))
    this.network.onFetchError(({ params }) => this.onFetchError(params))
    this.script.onRealmCreated(({ params }) => this.onRealmCreated(params))
    this.script.onRealmDestroyed(({ params }) => this.onRealmDestroyed(params))
  }

  // CDP equivalent: Network.requestWillBeSent
  private async onBeforeRequestSent (params: Bidi.Network.BeforeRequestSentParameters) {
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
  private onResponseStarted (params: Bidi.Network.ResponseStartedParameters) {
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
  private onResponseComplete (params: Bidi.Network.ResponseCompletedParameters) {
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
  private onFetchError (params: Bidi.Network.FetchErrorParameters) {
    debugVerbose('received network.fetchError %o', params)

    this.#automation.onRemoveBrowserPreRequest?.(params.request.request)
  }

  // CDP equivalent: trying to determine ServiceWorker.workerRegistrationUpdated
  private onRealmCreated (params: Bidi.Script.RealmInfo) {
    debugVerbose('received script.realmCreated %o', params)
    //  this.automation.onServiceWorkerRegistrationUpdated?.(params)
  }

  // CDP equivalent: trying to determine ServiceWorker.workerVersionUpdated
  private onRealmDestroyed (params: Bidi.Script.RealmDestroyedParameters) {
    debugVerbose('received script.realmDestroyed %o', params)
  }

  static async create (biDiWebSocketUrl: string, automation: Automation): Promise<any> {
    const bidiSocket = await BidiSocket.create(biDiWebSocketUrl)

    // TODO: need to do some type of memory cleanup by destroying the registered events in the event emitter via off or something
    const browsingContextModule = new BrowsingContextModule(bidiSocket)
    const inputModule = new InputModule(bidiSocket)
    const logModule = new LogModule(bidiSocket)
    const networkModule = new NetworkModule(bidiSocket)
    const sessionModule = new SessionModule(bidiSocket)
    const scriptModule = new ScriptModule(bidiSocket)
    const storageModule = new StorageModule(bidiSocket)

    const bidiAutomation = new BidiAutomation({
      browsingContextModule,
      inputModule,
      logModule,
      networkModule,
      sessionModule,
      scriptModule,
      storageModule,
    }, automation)

    return bidiAutomation
  }
}
