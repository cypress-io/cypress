import { Telemetry as TelemetryClass, TelemetryNoop, startSpanType } from './index'
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node'
import { envDetectorSync, processDetectorSync, osDetectorSync, hostDetectorSync } from '@opentelemetry/resources'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base'

let telemetryInstance: TelemetryNoop | TelemetryClass = new TelemetryNoop

const init = ({
  namespace,
  context,
  version,
  Exporter,
  apiUrl,
}: {
  namespace: string
  context?: {
    traceparent: string
  }
  version: string
  Exporter: any
  apiUrl: any
}) => {
  if (!process.env.CYPRESS_INTERNAL_ENABLE_TELEMETRY) {
    return
  }

  // console.log('apiUrl - in telemetry', apiUrl)

  const exporter = new Exporter({
    url: 'http://localhost:8080/telemetry',
    // url: 'https://api.honeycomb.io/v1/traces',
    headers: {
      'x-honeycomb-team': 'key',
      // 'x-project-id': projectId,
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
  // @ts-ignore
  attachProjectId: (projectId: string) => telemetryInstance.getExporter()?.attachProjectId(projectId),
}
