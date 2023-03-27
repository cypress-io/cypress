import type { Span } from '@opentelemetry/api'
import { Telemetry as TelemetryClass, TelemetryNoop, startSpanType } from './index'
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node'
import { envDetectorSync, processDetectorSync, osDetectorSync, hostDetectorSync } from '@opentelemetry/resources'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base'

let telemetryInstance: TelemetryNoop | TelemetryClass = new TelemetryNoop

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
  exporter: any
}) => {
  if (!process.env.CYPRESS_INTERNAL_ENABLE_TELEMETRY) {
    return
  }

  telemetryInstance = TelemetryClass.init({
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
  startSpan: (arg: startSpanType) => telemetryInstance.startSpan(arg),
  getSpan: (arg: string) => telemetryInstance.getSpan(arg),
  findActiveSpan: (arg: string) => telemetryInstance.findActiveSpan(arg),
  endActiveSpanAndChildren: (arg: Span): void => telemetryInstance.endActiveSpanAndChildren(arg),
  getActiveContextObject: () => telemetryInstance.getActiveContextObject(),
  shutdown: () => telemetryInstance.shutdown(),
  exporter: () => telemetryInstance.getExporter(),
}

export { OTLPTraceExporter as OTLPTraceExporterIpc } from './span-exporters/ipc-span-exporter'

export { OTLPTraceExporter as OTLPTraceExporterCloud } from './span-exporters/cloud-span-exporter'
