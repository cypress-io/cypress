import type { Span } from '@opentelemetry/api'
import type { startSpanOptions, findActiveSpanOptions, contextObject, Telemetry as TelemetryClass } from './telemetry/index'
import type { OTLPTraceExporter as OTLPTraceExporterCloud } from './span-exporters/cloud-span-exporter'
import type { OTLPTraceExporter as OTLPTraceExporterIpc } from './span-exporters/ipc-span-exporter'
import { TelemetryNoop } from './telemetry/noop'

export type { OTLPTraceExporterIpc, OTLPTraceExporterCloud, Span }

// The OpenTelemetry SDK and the exporters are required on demand rather than at module scope.
// Telemetry is off by default, and processes without a V8 snapshot, like the config child on
// the user's Node, would otherwise pay to load them on every start.

const enabledValues = ['true', '1']

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

  const { Telemetry }: typeof import('./telemetry/index') = require('./telemetry/index')

  // Telemetry only needs to be initialized once.
  if (telemetryInstance instanceof Telemetry) {
    throw ('Telemetry instance has already be initialized')
  }

  const { envDetectorSync, hostDetectorSync, osDetectorSync, processDetectorSync }: typeof import('@opentelemetry/resources') = require('@opentelemetry/resources')
  const { BatchSpanProcessor }: typeof import('@opentelemetry/sdk-trace-base') = require('@opentelemetry/sdk-trace-base')
  const { NodeTracerProvider }: typeof import('@opentelemetry/sdk-trace-node') = require('@opentelemetry/sdk-trace-node')
  const { circleCiDetectorSync }: typeof import('./detectors/circleCiDetectorSync') = require('./detectors/circleCiDetectorSync')

  telemetryInstance = new Telemetry({
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

/**
 * Creates the exporter that sends spans as http requests, encrypted by default, to Cypress Cloud.
 * @param options - the exporter options
 */
export const createCloudExporter = (options?: ConstructorParameters<typeof OTLPTraceExporterCloud>[0]): OTLPTraceExporterCloud => {
  const { OTLPTraceExporter }: typeof import('./span-exporters/cloud-span-exporter') = require('./span-exporters/cloud-span-exporter')

  return new OTLPTraceExporter(options)
}

/**
 * Creates the exporter that sends spans over ipc to the parent process, which forwards them.
 */
export const createIpcExporter = (): OTLPTraceExporterIpc => {
  const { OTLPTraceExporter }: typeof import('./span-exporters/ipc-span-exporter') = require('./span-exporters/ipc-span-exporter')

  return new OTLPTraceExporter()
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

export const decodeTelemetryContext = (telemetryCtx: string): { context?: contextObject, version?: string } => {
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
