import { Telemetry as TelemetryClass, TelemetryNoop, startSpanType } from './index'
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node'
import { envDetectorSync, processDetectorSync, osDetectorSync, hostDetectorSync } from '@opentelemetry/resources'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'

let telemetryInstance: TelemetryNoop | TelemetryClass = new TelemetryNoop

const init = ({
  namespace,
  context,
  version,
  Exporter,
  projectId,
}: {
  namespace: string
  context?: {
    traceparent: string
  }
  version: string
  Exporter: any
  projectId: any
}) => {
  const key = process.env.CYPRESS_TELEMETRY_KEY

  if (!key) {
    return
  }

  // const exporter = new OTLPTraceExporter({
  //   url: 'https://api.honeycomb.io/v1/traces',
  //   headers: {
  //     'x-honeycomb-team': key,
  //   },
  // })

  const ExporterClass = Exporter ? Exporter : OTLPTraceExporter

  const exporter = new ExporterClass({
    url: 'https://localhost:8080',
    headers: {
      // 'x-honeycomb-team': key,
      'x-project-id': projectId,
      'x-cypress-encrypted': '1',
    },
  })

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
  findActiveSpan: (arg: any) => telemetryInstance.findActiveSpan(arg),
  endActiveSpanAndChildren: (arg: any): void => telemetryInstance.endActiveSpanAndChildren(arg),
  getActiveContextObject: () => telemetryInstance.getActiveContextObject(),
  forceFlush: () => telemetryInstance.forceFlush(),
}
