import { Telemetry as TelemetryClass, TelemetryNoop } from './index'
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web'
import { browserDetector } from '@opentelemetry/resources'

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
  })

  // @ts-ignore
  window.cypressTelemetrySingleton = telemetryInstance

  return
}

export const telemetry = {
  init,
  startSpan: (arg) => telemetryInstance.startSpan(arg),
  getSpan: (arg) => telemetryInstance.getSpan(arg),
  getRootContextObject: () => telemetryInstance.getRootContextObject(),
  forceFlush: () => telemetryInstance.forceFlush(),
}
