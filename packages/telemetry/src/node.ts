import { Telemetry as TelemetryClass, TelemetryNoop } from './index'
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node'
import { envDetector, processDetector, osDetector, hostDetector } from '@opentelemetry/resources'
import pkg from '@packages/root'

let telemetryInstance: TelemetryNoop | TelemetryClass = new TelemetryNoop

const init = async ({ namespace, context }) => {
  const key = process.env.CYPRESS_TELEMETRY_KEY

  if (!key) {
    return
  }

  telemetryInstance = await TelemetryClass.init({
    namespace,
    Provider: NodeTracerProvider,
    detectors: [
      envDetector, processDetector, osDetector, hostDetector,
    ],
    rootContextObject: context,
    version: pkg.version,
    key,
  })

  return
}

export const telemetry = {
  init,
  startSpan: (arg) => telemetryInstance.startSpan(arg),
  getSpan: (arg) => telemetryInstance.getSpan(arg),
  getRootContextObject: () => telemetryInstance.getRootContextObject(),
  forceFlush: () => telemetryInstance.forceFlush(),
}
