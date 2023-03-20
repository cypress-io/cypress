import type { ReadableSpan } from '@opentelemetry/sdk-trace-base'
import type {
  OTLPExporterNodeConfigBase,
  OTLPExporterError,
} from '@opentelemetry/otlp-exporter-base'
import type {
  ExportResult,
} from '@opentelemetry/core'

import { diag } from '@opentelemetry/api'
import { OTLPTraceExporter as OTLPTraceExporterHttp } from '@opentelemetry/exporter-trace-otlp-http'
import {
  sendWithHttp,
} from '@opentelemetry/otlp-exporter-base'

import * as enc from './encryption'

/**
 * Collector Trace Exporter for Node
 */
export class OTLPTraceExporter
  extends OTLPTraceExporterHttp {
  constructor (config: OTLPExporterNodeConfigBase = {}) {
    super(config)
  }

  attachProjectId (projectId) {
    this.headers['x-project-id'] = projectId
  }

  export (
    items: ReadableSpan[],
    resultCallback: (result: ExportResult) => void,
  ): void {
    super.export(items, resultCallback)
  }

  send (
    objects: ReadableSpan[],
    onSuccess: () => void,
    onError: (error: OTLPExporterError) => void,
  ): void {
    // use user if not encypted
    if (this.headers['x-cypress-encrypted'] !== '1') {
      return super.send(objects, onSuccess, onError)
    }

    if (this._shutdownOnce.isCalled) {
      diag.debug('Shutdown already started. Cannot send objects')

      return
    }

    const serviceRequest = JSON.stringify(this.convert(objects))

    const promise = enc.encryptRequest({ url: '', method: 'post', body: serviceRequest }).then(({ secretKey, jwe }) => {
      return new Promise<void>((resolve, reject) => {
        sendWithHttp(
          this,
          JSON.stringify(jwe),
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
