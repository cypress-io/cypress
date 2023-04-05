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
  delayedExport: {items: ReadableSpan[], resultCallback: (result: ExportResult) => void}[]

  constructor () {
    super({})
    this.delayedExport = []
  }

  /**
   * Attaches the ipc and replays any exports called without it
   * @param ipc - the ipc used to send data
   */
  attachIPC (ipc: any): void {
    this.ipc = ipc
    this.delayedExport.forEach(({ items, resultCallback }) => {
      this.export(items, resultCallback)
    })
  }

  /**
   * Overrides export to delay sending spans if the ipc has not been attached
   * @param items
   * @param resultCallback
   */
  export (
    items: ReadableSpan[],
    resultCallback: (result: ExportResult) => void,
  ): void {
    if (!this.ipc) {
      this.delayedExport.push({ items, resultCallback })
    } else {
      super.export(items, resultCallback)
    }
  }

  /**
   * Overrides send to use IPC instead of http
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
      return new Promise<void>((resolve) => {
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
