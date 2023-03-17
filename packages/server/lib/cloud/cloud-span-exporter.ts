/*
 * Copyright The OpenTelemetry Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type * as http from 'http'
import type * as https from 'https'

// import type { CompressionAlgorithm } from './types'
// import * as otlpTypes from '../../types'
// import {
//   parseHeaders,
//   CompressionAlgorithm,
//   createHttpAgent,
//   sendWithHttp,
//   configureCompression,
// } from '@opentelemetry/otlp-exporter-base'
// import { createHttpAgent, sendWithHttp, configureCompression } from './util'
import { diag } from '@opentelemetry/api'

import type { ReadableSpan, SpanExporter } from '@opentelemetry/sdk-trace-base'
import { getEnv, baggageUtils } from '@opentelemetry/core'
import {
  OTLPExporterBase,
  OTLPExporterNodeConfigBase,
  OTLPExporterError,
  appendResourcePathToUrl,
  appendRootPathToUrlIfNeeded,
  parseHeaders,
  CompressionAlgorithm,
  createHttpAgent,
  sendWithHttp,
  configureCompression,
} from '@opentelemetry/otlp-exporter-base'

import {
  createExportTraceServiceRequest,
  IExportTraceServiceRequest,
} from '@opentelemetry/otlp-transformer'

import * as enc from './encryption'

const DEFAULT_COLLECTOR_RESOURCE_PATH = 'v1/traces'
const DEFAULT_COLLECTOR_URL = `http://localhost:4318/${DEFAULT_COLLECTOR_RESOURCE_PATH}`

/**
 * Collector Trace Exporter for Node
 */
export class OTLPTraceExporter
  extends OTLPExporterBase<
  OTLPExporterNodeConfigBase,
  ReadableSpan,
  IExportTraceServiceRequest
  > implements SpanExporter {
  DEFAULT_HEADERS: Record<string, string> = {};
  headers: Record<string, string>;
  agent: http.Agent | https.Agent | undefined;
  compression: CompressionAlgorithm;

  constructor (config: OTLPExporterNodeConfigBase = {}) {
    super(config)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((config as any).metadata) {
      diag.warn('Metadata cannot be set when using http')
    }

    this.headers = Object.assign(
      this.DEFAULT_HEADERS,
      parseHeaders(config.headers),
      baggageUtils.parseKeyPairsIntoRecord(getEnv().OTEL_EXPORTER_OTLP_HEADERS),
    )

    this.agent = createHttpAgent(config)
    this.compression = configureCompression(config.compression)
    this.headers = Object.assign(
      this.headers,
      baggageUtils.parseKeyPairsIntoRecord(
        getEnv().OTEL_EXPORTER_OTLP_TRACES_HEADERS,
      ),
    )
  }

  convert (spans: ReadableSpan[]): IExportTraceServiceRequest {
    return createExportTraceServiceRequest(spans, true)
  }

  getDefaultUrl (config: OTLPExporterNodeConfigBase): string {
    return typeof config.url === 'string'
      ? config.url
      : getEnv().OTEL_EXPORTER_OTLP_TRACES_ENDPOINT.length > 0
        ? appendRootPathToUrlIfNeeded(getEnv().OTEL_EXPORTER_OTLP_TRACES_ENDPOINT)
        : getEnv().OTEL_EXPORTER_OTLP_ENDPOINT.length > 0
          ? appendResourcePathToUrl(
            getEnv().OTEL_EXPORTER_OTLP_ENDPOINT,
            DEFAULT_COLLECTOR_RESOURCE_PATH,
          )
          : DEFAULT_COLLECTOR_URL
  }

  onInit (_config: OTLPExporterNodeConfigBase): void {}

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

  onShutdown (): void {}
}
