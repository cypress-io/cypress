import { telemetry } from '@packages/telemetry'
import { Http, ServerCtx } from './http'
import type { BrowserPreRequest } from './types'
import type Protocol from 'devtools-protocol'
import type { ServiceWorkerClientEvent } from './http/util/service-worker-manager'

export class NetworkProxy {
  http: Http

  constructor (opts: ServerCtx) {
    this.http = new Http(opts)
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

    await this.http.handleHttpRequest(req, res, span).finally(() => {
      span?.end()
    })
  }

  async handleSourceMapRequest (req, res) {
    await this.http.handleSourceMapRequest(req, res)
  }

  setHttpBuffer (buffer) {
    this.http.setBuffer(buffer)
  }

  reset (options: { resetBetweenSpecs: boolean } = { resetBetweenSpecs: false }) {
    this.http.reset(options)
  }

  setProtocolManager (protocolManager) {
    this.http.setProtocolManager(protocolManager)
  }

  setPreRequestTimeout (timeout) {
    this.http.setPreRequestTimeout(timeout)
  }
}
