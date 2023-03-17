import { Telemetry as TelemetryClass, TelemetryNoop, startSpanType } from './index'
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web'
import { browserDetectorSync } from '@opentelemetry/resources'
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base'
// import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto'
import { WebsocketSpanExporter } from './websocket-span-exporter'

let telemetryInstance: TelemetryNoop | TelemetryClass = new TelemetryNoop

let exporter: WebsocketSpanExporter

const init = ({ namespace, config }: { namespace?: string, config?: any} = {}) => {
  // @ts-ignore
  if (window.cypressTelemetrySingleton) {
    // @ts-ignore
    telemetryInstance = window.cypressTelemetrySingleton

    return
  }

  // @ts-ignore
  const { context, key } = window.__CYPRESS_TELEMETRY__

  if (!key) {
    // @ts-ignore
    window.cypressTelemetrySingleton = telemetryInstance

    return
  }

  // const exporter = new OTLPTraceExporter({
  //   url: 'https://api.honeycomb.io/v1/traces',
  //   headers: {
  //     'x-honeycomb-team': key,
  //   },
  // })

  exporter = new WebsocketSpanExporter()

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
  findActiveSpan: (arg: any) => telemetryInstance.findActiveSpan(arg),
  endActiveSpanAndChildren: (arg: any): void => telemetryInstance.endActiveSpanAndChildren(arg),
  getActiveContextObject: () => telemetryInstance.getActiveContextObject(),
  forceFlush: () => telemetryInstance.forceFlush(),
  attachWebSocket: (ws: any) => exporter?.attachWebSocket(ws),
}
