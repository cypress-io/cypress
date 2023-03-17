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

import type { SpanExporter, ReadableSpan } from '@opentelemetry/sdk-trace-base'

import {
  ExportResult,
  ExportResultCode,
  hrTimeToMicroseconds,
} from '@opentelemetry/core'

/**
 * This is implementation of {@link SpanExporter} that prints spans to the
 * console. This class can be used for diagnostic purposes.
 */

/* eslint-disable no-console */
export class WebsocketSpanExporter implements SpanExporter {
  ws: any

  /**
   * Export spans.
   * @param spans
   * @param resultCallback
   */
  export (
    spans: ReadableSpan[],
    resultCallback: (result: ExportResult) => void,
  ): void {
    console.log('spans', spans)

    if (!this.ws) {
      // save off spans waiting for a ws to be available
      console.log('no web socket! bail!')

      return
    }

    return this._sendSpans(spans, resultCallback)
  }

  /**
   * Shutdown the exporter.
   */
  shutdown (): Promise<void> {
    this._sendSpans([])

    return Promise.resolve()
  }

  attachWebSocket (ws: any) {
    console.log('attach web socket')
    this.ws = ws
    // Also kick off sending any outstanding spans
  }

  /**
   * converts span info into more readable format
   * @param span
   */
  private _exportInfo (span: ReadableSpan) {
    return {
      traceId: span.spanContext().traceId,
      parentId: span.parentSpanId,
      traceState: span.spanContext().traceState?.serialize(),
      name: span.name,
      id: span.spanContext().spanId,
      kind: span.kind,
      timestamp: hrTimeToMicroseconds(span.startTime),
      duration: hrTimeToMicroseconds(span.duration),
      attributes: span.attributes,
      status: span.status,
      events: span.events,
      links: span.links,
    }
  }

  /**
   * Showing spans in console
   * @param spans
   * @param done
   */
  private _sendSpans (
    spans: ReadableSpan[],
    done?: (result: ExportResult) => void,
  ): void {
    for (const span of spans) {
      console.dir(this._exportInfo(span), { depth: 3 })
      console.log('websocket span exporter at work!')
    }
    if (done) {
      return done({ code: ExportResultCode.SUCCESS })
    }
  }
}
