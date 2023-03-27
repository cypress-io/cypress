import type { ReadableSpan } from '@opentelemetry/sdk-trace-base'
import type {
  OTLPExporterError,
} from '@opentelemetry/otlp-exporter-base'
import type { ExportResult } from '@opentelemetry/core'

import { diag } from '@opentelemetry/api'
import { OTLPTraceExporter as OTLPTraceExporterHttp } from '@opentelemetry/exporter-trace-otlp-http'

/**
 * Collector Trace Exporter for Node
 */
export class OTLPTraceExporter
  extends OTLPTraceExporterHttp {
  ipc: any
  delayedItemsToExport: ReadableSpan[]
  constructor () {
    super({})
    this.delayedItemsToExport = []
  }

  /**
   * Adds the projectId as a header and exports any delayed spans.
   * @param projectId - the id of the project to export spans for.
   */
  attachIPC (ipc: any): void {
    this.ipc = ipc

    if (this.delayedItemsToExport.length > 0) {
      this.export(this.delayedItemsToExport, () => {})
    }
  }

  /**
   * Overrides export to delay sending spans if encryption is needed and there is no attached projectId
   * @param items
   * @param resultCallback
   */
  export (
    items: ReadableSpan[],
    resultCallback: (result: ExportResult) => void,
  ): void {
    if (!this.ipc) {
      this.delayedItemsToExport.push.apply(items)
    } else {
      super.export(items, resultCallback)
    }
  }

  /**
   * Overrides send if we need to encrypt the request.
   * @param objects
   * @param onSuccess
   * @param onError
   * @returns
   */
  send (
    objects: ReadableSpan[],
    onSuccess: () => void,
    onError: (error: OTLPExporterError) => void,
  ): void {
    if (this._shutdownOnce.isCalled) {
      diag.debug('Shutdown already started. Cannot send objects')

      return
    }

    const serviceRequest = JSON.stringify(this.convert(objects))

    const promise = Promise.resolve().then(() => {
      return new Promise<void>((resolve, reject) => {
        this.ipc.send('export:telemetry', serviceRequest)
        resolve()
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
