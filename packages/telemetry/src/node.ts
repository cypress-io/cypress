import type { Span } from '@opentelemetry/api'
import type { startSpanOptions, findActiveSpanOptions, contextObject } from './index'
import { Telemetry as TelemetryClass, TelemetryNoop } from './index'
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node'
import { envDetectorSync, processDetectorSync, osDetectorSync, hostDetectorSync } from '@opentelemetry/resources'
import { circleCiDetectorSync } from './detectors/circleCiDetectorSync'
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
 * Provide a single place to check if telemetry should be enabled in verbose mode.
 * @returns boolean
 */
const isVerboseEnabled = (): boolean => process.env.CYPRESS_INTERNAL_ENABLE_TELEMETRY_VERBOSE === 'true'

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
  context?: contextObject
  version: string
  exporter: OTLPTraceExporterIpc | OTLPTraceExporterCloud
}): void => {
  if (!isEnabled()) {
    return
  }

  // Telemetry only needs to be initialized once.
  if (telemetryInstance instanceof TelemetryClass) {
    throw ('Telemetry instance has already be initialized')
  }

  telemetryInstance = new TelemetryClass({
    namespace,
    Provider: NodeTracerProvider,
    detectors: [
      envDetectorSync, processDetectorSync, osDetectorSync, hostDetectorSync, circleCiDetectorSync,
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
  startSpan: (arg: startSpanOptions) => {
    // if the span is declared in verbose mode, but verbosity is disabled, no-op the span creation
    if (arg.isVerbose && !isVerboseEnabled()) {
      return undefined
    }

    return telemetryInstance.startSpan(arg)
  },
  getSpan: (arg: string) => telemetryInstance.getSpan(arg),
  findActiveSpan: (arg: findActiveSpanOptions) => telemetryInstance.findActiveSpan(arg),
  endActiveSpanAndChildren: (arg?: Span): void => telemetryInstance.endActiveSpanAndChildren(arg),
  getActiveContextObject: () => telemetryInstance.getActiveContextObject(),
  getResources: () => telemetryInstance.getResources(),
  shutdown: () => telemetryInstance.shutdown(),
  exporter: (): void | OTLPTraceExporterIpc | OTLPTraceExporterCloud => telemetryInstance.getExporter() as void | OTLPTraceExporterIpc | OTLPTraceExporterCloud,
}

export const decodeTelemetryContext = (telemetryCtx: string): {context?: contextObject, version?: string} => {
  if (telemetryCtx) {
    return JSON.parse(
      Buffer.from(telemetryCtx, 'base64').toString('utf-8'),
    )
  }

  return {}
}

export const encodeTelemetryContext = ({ context, version }: { context?: contextObject, version?: string }): string => {
  return Buffer.from(JSON.stringify({
    context,
    version,
  })).toString('base64')
}
