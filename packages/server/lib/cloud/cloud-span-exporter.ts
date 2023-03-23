import type {
  ReadableSpan,
  OTLPExporterNodeConfigBase,
  OTLPExporterError,
} from '@packages/telemetry'

import {
  diag,
  OTLPTraceExporterHttp,
  sendWithHttp,
} from '@packages/telemetry'

import * as enc from './encryption'

/**
 * Collector Trace Exporter for Node
 */
export class OTLPTraceExporter
  extends OTLPTraceExporterHttp {
  delayedItemsToExport: string[]
  constructor (config: OTLPExporterNodeConfigBase = {}) {
    super(config)
    this.delayedItemsToExport = []
  }

  /**
   * Adds the projectId as a header and exports any delayed spans.
   * @param projectId - the id of the project to export spans for.
   */
  attachProjectId (projectId: string | null | undefined): void {
    if (!projectId) {
      return
    }

    this.headers['x-project-id'] = projectId
    this.delayedItemsToExport.forEach((item) => {
      this.send(item, () => {}, () => {})
    })
  }

  requiresEncryption (): boolean {
    return this.headers['x-cypress-encrypted'] === '1'
  }

  /**
   * Overrides send if we need to encrypt the request.
   * @param objects
   * @param onSuccess
   * @param onError
   * @returns
   */
  send (
    objects: ReadableSpan[] | string,
    onSuccess: () => void,
    onError: (error: OTLPExporterError) => void,
  ): void {
    if (this._shutdownOnce.isCalled) {
      diag.debug('Shutdown already started. Cannot send objects')

      return
    }

    let serviceRequest

    if (typeof objects !== 'string') {
      serviceRequest = JSON.stringify(this.convert(objects))
    } else {
      serviceRequest = objects
    }

    if (this.requiresEncryption() && !this.headers['x-project-id']) {
      this.delayedItemsToExport.push(serviceRequest)

      return
    }

    const prepareRequest = (request: string): Promise<string> => {
      if (this.requiresEncryption()) {
        return enc.encryptRequest({ url: this.url, method: 'post', body: serviceRequest }).then(({ secretKey, jwe }) => JSON.stringify(jwe))
      }

      return Promise.resolve(request)
    }

    const promise = prepareRequest(serviceRequest).then((body) => {
      return new Promise<void>((resolve, reject) => {
        sendWithHttp(
          this,
          body,
          'application/json',
          resolve,
          reject,
        )
      })
    }).then(onSuccess, onError)

    this._sendingPromises.push(promise)
    const popPromise = () => {
      const index = this._sendingPromises.indexOf(promise)

      this._sendingPromises.splice(index, 1)
    }

    promise.then(popPromise, popPromise)
  }
}
