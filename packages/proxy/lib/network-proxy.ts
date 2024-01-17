import { telemetry } from '@packages/telemetry'
import { Http, ServerCtx } from './http'
import type { BrowserPreRequest } from './types'
import type Protocol from 'devtools-protocol'

export class NetworkProxy {
  http: Http

  constructor (opts: ServerCtx) {
    this.http = new Http(opts)
  }

  addPendingBrowserPreRequest (preRequest: BrowserPreRequest) {
    this.http.addPendingBrowserPreRequest(preRequest)
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

  updateServiceWorkerClientSideRegistrations (data: { scriptURL: string, initiatorURL: string }) {
    this.http.updateServiceWorkerClientSideRegistrations(data)
  }

  handleHttpRequest (req, res) {
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

    this.http.handleHttpRequest(req, res, span).finally(() => {
      span?.end()
    })
  }

  handleSourceMapRequest (req, res) {
    this.http.handleSourceMapRequest(req, res)
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
