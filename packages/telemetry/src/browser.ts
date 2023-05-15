import type { Span, Attributes } from '@opentelemetry/api'
import type { startSpanOptions, findActiveSpanOptions, contextObject } from './index'
import { Telemetry as TelemetryClass, TelemetryNoop } from './index'
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web'
import { browserDetectorSync } from '@opentelemetry/resources'
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base'
import { OTLPTraceExporter } from './span-exporters/websocket-span-exporter'

declare global {
  interface Window {
    __CYPRESS_TELEMETRY__?: {context: {context: {traceparent: string}, attributes: Attributes}, resources: Attributes, isVerbose: boolean}
    cypressTelemetrySingleton?: TelemetryClass | TelemetryNoop
  }
}

let telemetryInstance: TelemetryNoop | TelemetryClass = new TelemetryNoop

/**
 * Initialize the telemetry singleton
 * @param namespace - namespace to apply to the singleton
 * @param config - object containing the version
 * @returns void
 */
const init = ({ namespace, config }: { namespace: string, config: {version: string}}): void => {
  // If we don't have cypress_telemetry setup on window don't even bother making the global instance
  if (!window.__CYPRESS_TELEMETRY__) {
    return
  }

  // Telemetry only needs to be initialized once.
  if (telemetryInstance instanceof TelemetryClass) {
    throw ('Telemetry instance has already be initialized')
  }

  const { context, resources, isVerbose } = window.__CYPRESS_TELEMETRY__

  // We always use the websocket exporter for browser telemetry
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
    resources,
    isVerbose,
  })

  window.cypressTelemetrySingleton = telemetryInstance

  return
}

/**
 * If telemetry has already been setup, attach this singleton to this instance
 * @returns
 */
const attach = (): void => {
  if (window.cypressTelemetrySingleton) {
    telemetryInstance = window.cypressTelemetrySingleton

    return
  }
}

export const telemetry = {
  init,
  attach,
  startSpan: (arg: startSpanOptions) => telemetryInstance.startSpan(arg),
  getSpan: (arg: string) => telemetryInstance.getSpan(arg),
  findActiveSpan: (arg: findActiveSpanOptions) => telemetryInstance.findActiveSpan(arg),
  endActiveSpanAndChildren: (arg?: Span): void => telemetryInstance.endActiveSpanAndChildren(arg),
  getActiveContextObject: () => telemetryInstance.getActiveContextObject(),
  shutdown: () => telemetryInstance.shutdown(),
  attachWebSocket: (ws: any) => (telemetryInstance.getExporter() as OTLPTraceExporter)?.attachWebSocket(ws),
  setRootContext: (context?: contextObject) => (telemetryInstance.setRootContext(context)),
}

export type { Span } from '@opentelemetry/api'
