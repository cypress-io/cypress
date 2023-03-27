import type { Span } from '@opentelemetry/api'
import { Telemetry as TelemetryClass, TelemetryNoop, startSpanType } from './index'
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web'
import { browserDetectorSync } from '@opentelemetry/resources'
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base'
import { OTLPTraceExporter } from './span-exporters/websocket-span-exporter'

let telemetryInstance: TelemetryNoop | TelemetryClass = new TelemetryNoop

const init = ({ namespace, config }: { namespace: string, config: any}) => {
  // @ts-ignore
  if (!window.__CYPRESS_TELEMETRY__) {
    // @ts-ignore
    window.cypressTelemetrySingleton = telemetryInstance

    return
  }

  // @ts-ignore
  const { context } = window.__CYPRESS_TELEMETRY__

  const exporter = new OTLPTraceExporter()

  telemetryInstance = new TelemetryClass({
    namespace,
    Provider: WebTracerProvider,
    detectors: [
      browserDetectorSync,
    ],
    rootContextObject: context,
    version: config?.version,
    exporter,
    // Because otel is lame we need to use the simple span processor instead of the batch processor
    // or we risk losing spans when the browser navigates.
    // TODO: create a browser batch span processor to account for navigation.
    // See https://github.com/open-telemetry/opentelemetry-js/issues/2613
    SpanProcessor: SimpleSpanProcessor,
  })

  // @ts-ignore
  window.cypressTelemetrySingleton = telemetryInstance

  return
}

const attach = () => {
  // @ts-ignore
  if (window.cypressTelemetrySingleton) {
    // @ts-ignore
    telemetryInstance = window.cypressTelemetrySingleton

    return
  }
}

export const telemetry = {
  init,
  attach,
  startSpan: (arg: startSpanType) => telemetryInstance.startSpan(arg),
  getSpan: (arg: string) => telemetryInstance.getSpan(arg),
  findActiveSpan: (arg: any) => telemetryInstance.findActiveSpan(arg),
  endActiveSpanAndChildren: (arg: Span): void => telemetryInstance.endActiveSpanAndChildren(arg),
  getActiveContextObject: () => telemetryInstance.getActiveContextObject(),
  shutdown: () => telemetryInstance.shutdown(),
  attachWebSocket: (ws: any) => (telemetryInstance.getExporter() as OTLPTraceExporter)?.attachWebSocket(ws),
}
