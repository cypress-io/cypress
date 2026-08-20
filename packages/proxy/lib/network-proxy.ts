import { telemetry } from '@packages/telemetry'
import { Http, ServerCtx } from './http'
import type { BrowserPreRequest } from './types'
import type { ForHttpIntercept } from '@packages/network-interception'
import type Protocol from 'devtools-protocol'
import type { ServiceWorkerClientEvent } from './http/util/service-worker-manager'
import { resourceTypeAndCredentialManager, ResourceType, RequestCredentialLevel } from './resourceTypeAndCredentialManager'
import { proxyHttpCodec } from './adapters/http-codec'

export class NetworkProxy {
  http: Http

  constructor (opts: ServerCtx) {
    this.http = new Http(opts)
  }

  get codec () {
    return proxyHttpCodec
  }

  withIntercept <TRequest, TResponse> (
    networkInterception: ForHttpIntercept<TRequest, TResponse>,
  ) {
    this.http.networkInterception = networkInterception

    return this
  }

  async addPendingBrowserPreRequest (preRequest: BrowserPreRequest) {
    await this.http.addPendingBrowserPreRequest(preRequest)
  }

  removePendingBrowserPreRequest (requestId: string) {
    this.http.removePendingBrowserPreRequest(requestId)
  }

  getPendingBrowserPreRequests () {
    return this.http.getPendingBrowserPreRequests()
  }

  addPendingUrlWithoutPreRequest (url: string) {
    this.http.addPendingUrlWithoutPreRequest(url)
  }

  updateServiceWorkerRegistrations (data: Protocol.ServiceWorker.WorkerRegistrationUpdatedEvent) {
    this.http.updateServiceWorkerRegistrations(data)
  }

  updateServiceWorkerVersions (data: Protocol.ServiceWorker.WorkerVersionUpdatedEvent) {
    this.http.updateServiceWorkerVersions(data)
  }

  updateServiceWorkerClientSideRegistrations (data: { scriptURL: string, initiatorOrigin: string }) {
    this.http.updateServiceWorkerClientSideRegistrations(data)
  }

  handleServiceWorkerClientEvent (event: ServiceWorkerClientEvent) {
    this.http.handleServiceWorkerClientEvent(event)
  }

  async handleHttpRequest (req, res) {
    const span = telemetry.startSpan({
      name: 'network:proxy:handleHttpRequest',
      opts: {
        attributes: {
          'network:proxy:url': req.proxiedUrl,
          'network:proxy:contentType': req.get('content-type'),
        },
      },
      isVerbose: true,
    })

    await this.http.handleHttpRequest(req, res, span || undefined).finally(() => {
      span?.end()
    })
  }

  setHttpBuffer (buffer) {
    this.http.setBuffer(buffer)
  }

  reset (options: { resetBetweenSpecs: boolean } = { resetBetweenSpecs: false }) {
    this.http.reset(options)
  }

  /**
   * Releases long-lived timers owned by this proxy. Used when replacing the
   * CDP Fetch NetworkProxy so prior PreRequests sweep intervals do not leak.
   */
  dispose () {
    this.http.preRequests.dispose()
    this.reset({ resetBetweenSpecs: true })
  }

  setProtocolManager (protocolManager) {
    this.http.setProtocolManager(protocolManager)
  }

  setPreRequestTimeout (timeout) {
    this.http.setPreRequestTimeout(timeout)
  }

  setCredentials ({ url, resourceType, credentialStatus }: {
    url: string
    resourceType: ResourceType
    credentialStatus: RequestCredentialLevel
  }): void {
    resourceTypeAndCredentialManager.set({ url, resourceType, credentialStatus })
  }

  clearCredentials (): void {
    resourceTypeAndCredentialManager.clear()
  }
}
