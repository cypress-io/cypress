import { Telemetry as TelemetryClass, TelemetryNoop } from './index'
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web'
import { browserDetector } from '@opentelemetry/resources'
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base'

let telemetryInstance: TelemetryNoop | TelemetryClass = new TelemetryNoop

const init = async ({ namespace, config }: { namespace?: string, config?: any} = {}) => {
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

  telemetryInstance = await TelemetryClass.init({
    namespace,
    Provider: WebTracerProvider,
    detectors: [
      browserDetector,
    ],
    rootContextObject: context,
    version: config?.version,
    key,
    SpanProcessor: SimpleSpanProcessor, // Because otel is lame we need to use the simple span processor instead of the batch processor or we risk losing spans when the browser navigates.
  })

  // @ts-ignore
  window.cypressTelemetrySingleton = telemetryInstance

  return
}

export const telemetry = {
  init,
  startSpan: (arg: any) => telemetryInstance.startSpan(arg),
  getSpan: (arg: string) => telemetryInstance.getSpan(arg),
  getActiveContextObject: () => telemetryInstance.getActiveContextObject(),
  forceFlush: () => telemetryInstance.forceFlush(),
}
