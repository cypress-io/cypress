import type { Span } from '@opentelemetry/api'
import type { startSpanType, findActiveSpan } from './index'
import { Telemetry as TelemetryClass, TelemetryNoop } from './index'
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node'
import { envDetectorSync, processDetectorSync, osDetectorSync, hostDetectorSync } from '@opentelemetry/resources'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base'

import { OTLPTraceExporter as OTLPTraceExporterIpc } from './span-exporters/ipc-span-exporter'
import { OTLPTraceExporter as OTLPTraceExporterCloud } from './span-exporters/cloud-span-exporter'

export { OTLPTraceExporterIpc, OTLPTraceExporterCloud }

let telemetryInstance: TelemetryNoop | TelemetryClass = new TelemetryNoop

/**
 * Provide a single place to check if telemetry should be enabled.
 * @returns boolean
 */
const isEnabled = (): boolean => process.env.CYPRESS_INTERNAL_ENABLE_TELEMETRY === 'true'

/**
 * Initialize the telemetry singleton
 * @param namespace - namespace to apply to the singleton
 * @param context - context to apply if it exists
 * @param version - cypress version
 * @param exporter - the exporter to be used.
 * @returns
 */
const init = ({
  namespace,
  context,
  version,
  exporter,
}: {
  namespace: string
  context?: {
    traceparent: string
  }
  version: string
  exporter: OTLPTraceExporterIpc | OTLPTraceExporterCloud
}): void => {
  if (!isEnabled()) {
    return
  }

  telemetryInstance = new TelemetryClass({
    namespace,
    Provider: NodeTracerProvider,
    detectors: [
      envDetectorSync, processDetectorSync, osDetectorSync, hostDetectorSync,
    ],
    rootContextObject: context,
    version,
    exporter,
    SpanProcessor: BatchSpanProcessor,
  })

  return
}

export const telemetry = {
  init,
  isEnabled,
  startSpan: (arg: startSpanType) => telemetryInstance.startSpan(arg),
  getSpan: (arg: string) => telemetryInstance.getSpan(arg),
  findActiveSpan: (arg: findActiveSpan) => telemetryInstance.findActiveSpan(arg),
  endActiveSpanAndChildren: (arg: Span): void => telemetryInstance.endActiveSpanAndChildren(arg),
  getActiveContextObject: () => telemetryInstance.getActiveContextObject(),
  shutdown: () => telemetryInstance.shutdown(),
  exporter: () => telemetryInstance.getExporter(),
}
