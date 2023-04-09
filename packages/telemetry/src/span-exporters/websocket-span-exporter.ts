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
  ws: any
  delayedExport: {items: ReadableSpan[], resultCallback: (result: ExportResult) => void}[]
  constructor () {
    super({})
    this.delayedExport = []
  }

  /**
   * attaches the websocket and replays any exports called without it
   * @param ws - the web socket.
   */
  attachWebSocket (ws: any): void {
    this.ws = ws
    this.delayedExport.forEach(({ items, resultCallback }) => {
      this.export(items, resultCallback)
    })
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
    if (!this.ws) {
      this.delayedExport.push({ items, resultCallback })
    } else {
      super.export(items, resultCallback)
    }
  }

  /**
   * Overrides the send method to use a websocket instead of http
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
        this.ws.emit('backend:request', 'telemetry', serviceRequest, (res?: { error: Error }) => {
          if (res && res.error) {
            reject(res.error)
          }

          resolve()
        })
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
