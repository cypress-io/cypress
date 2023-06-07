import type { Span } from '@opentelemetry/api'
import type { startSpanOptions, findActiveSpanOptions, contextObject } from './index'
import {
  envDetectorSync, hostDetectorSync, osDetectorSync, processDetectorSync,
} from '@opentelemetry/resources'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base'
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node'
import { circleCiDetectorSync } from './detectors/circleCiDetectorSync'
import { enabledValues, Telemetry as TelemetryClass, TelemetryNoop } from './index'
import { OTLPTraceExporter as OTLPTraceExporterCloud } from './span-exporters/cloud-span-exporter'
import { OTLPTraceExporter as OTLPTraceExporterIpc } from './span-exporters/ipc-span-exporter'

export { OTLPTraceExporterIpc, OTLPTraceExporterCloud, Span }

let telemetryInstance: TelemetryNoop | TelemetryClass = new TelemetryNoop

/**
 * Check if the env is enabled
 * @returns boolean
 */
const isEnabledEnV = (): boolean => enabledValues.includes(process.env.CYPRESS_INTERNAL_ENABLE_TELEMETRY || '')

/**
 * Provide a single place to check if telemetry should be enabled in verbose mode.
 * @returns boolean
 */
const isVerboseEnabled = (): boolean => enabledValues.includes(process.env.CYPRESS_INTERNAL_ENABLE_TELEMETRY_VERBOSE || '')

/**
 * Provide a single place to check if telemetry should be enabled.
 * @returns boolean
 */
const isEnabled = (): boolean => isEnabledEnV() || isVerboseEnabled()

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
    isVerbose: isVerboseEnabled(),
  })

  return
}

export const telemetry = {
  init,
  isEnabled,
  startSpan: (arg: startSpanOptions) => telemetryInstance.startSpan(arg),
  getSpan: (arg: string) => telemetryInstance.getSpan(arg),
  findActiveSpan: (arg: findActiveSpanOptions) => telemetryInstance.findActiveSpan(arg),
  endActiveSpanAndChildren: (arg?: Span): void => telemetryInstance.endActiveSpanAndChildren(arg),
  getActiveContextObject: () => telemetryInstance.getActiveContextObject(),
  getResources: () => telemetryInstance.getResources(),
  shutdown: () => telemetryInstance.shutdown(),
  isVerbose: () => isVerboseEnabled(),
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
