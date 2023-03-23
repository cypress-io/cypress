import type { Span } from '@opentelemetry/api'
import { Telemetry as TelemetryClass, TelemetryNoop, startSpanType } from './index'
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web'
import { browserDetectorSync } from '@opentelemetry/resources'
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base'
import { OTLPTraceExporter } from './websocket-span-exporter'

let telemetryInstance: TelemetryNoop | TelemetryClass = new TelemetryNoop

const init = ({ namespace, config }: { namespace?: string, config?: any} = {}) => {
  // @ts-ignore
  if (window.cypressTelemetrySingleton) {
    // @ts-ignore
    telemetryInstance = window.cypressTelemetrySingleton

    return
  }

  // @ts-ignore
  const { context, enabled } = window.__CYPRESS_TELEMETRY__

  if (!enabled) {
    // @ts-ignore
    window.cypressTelemetrySingleton = telemetryInstance

    return
  }

  const exporter = new OTLPTraceExporter()

  telemetryInstance = TelemetryClass.init({
    namespace,
    Provider: WebTracerProvider,
    detectors: [
      browserDetectorSync,
    ],
    rootContextObject: context,
    version: config?.version,
    exporter,
    SpanProcessor: SimpleSpanProcessor, // Because otel is lame we need to use the simple span processor instead of the batch processor or we risk losing spans when the browser navigates.
  })

  // @ts-ignore
  window.cypressTelemetrySingleton = telemetryInstance

  return
}

export const telemetry = {
  init,
  startSpan: (arg: startSpanType) => telemetryInstance.startSpan(arg),
  getSpan: (arg: string) => telemetryInstance.getSpan(arg),
  findActiveSpan: (arg: string) => telemetryInstance.findActiveSpan(arg),
  endActiveSpanAndChildren: (arg: Span): void => telemetryInstance.endActiveSpanAndChildren(arg),
  getActiveContextObject: () => telemetryInstance.getActiveContextObject(),
  forceFlush: () => telemetryInstance.forceFlush(),
  attachWebSocket: (ws: any) => (telemetryInstance.getExporter() as OTLPTraceExporter)?.attachWebSocket(ws),
}
