import type { DetectorSync, IResource, ResourceAttributes, ResourceDetectionConfig } from '@opentelemetry/resources'
import { processDetectorSync as otelProcessDetectorSync, Resource } from '@opentelemetry/resources'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'

export const REDACTED = '[REDACTED]'

// Argument values can be secrets: the record key from `cypress run`, and
// whatever a project passes in --env or --config. Only flag names are kept,
// so a flag added later cannot leak either.
const redactArg = (arg: string): string => {
  if (!arg.startsWith('-')) {
    return REDACTED
  }

  const valueStart = arg.indexOf('=')

  return valueStart === -1 ? arg : `${arg.slice(0, valueStart)}=${REDACTED}`
}

/**
 * Keeps the executable and the flag names from a command line and replaces
 * every argument value.
 * @param args - the process's command line arguments, executable first
 * @returns the executable followed by the redacted arguments
 */
export const redactCommandArgs = (args: string[]): string[] => {
  return args.map((arg, i) => i === 0 ? arg : redactArg(arg))
}

const isStringArray = (value: unknown): value is string[] => {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

/**
 * Detects the same process attributes as OpenTelemetry's process detector,
 * with argument values redacted from every attribute taken from the command line.
 */
class ProcessDetectorSync implements DetectorSync {
  detect (config?: ResourceDetectionConfig): IResource {
    const { attributes } = otelProcessDetectorSync.detect(config)
    const args = attributes[SemanticResourceAttributes.PROCESS_COMMAND_ARGS]
    const command = attributes[SemanticResourceAttributes.PROCESS_COMMAND]
    const redacted: ResourceAttributes = { ...attributes }

    // Anything that cannot be redacted is dropped, so an attribute shape this
    // does not recognize never reaches the exporter
    delete redacted[SemanticResourceAttributes.PROCESS_COMMAND_ARGS]
    delete redacted[SemanticResourceAttributes.PROCESS_COMMAND]
    delete redacted[SemanticResourceAttributes.PROCESS_COMMAND_LINE]

    if (isStringArray(args)) {
      redacted[SemanticResourceAttributes.PROCESS_COMMAND_ARGS] = redactCommandArgs(args)
    }

    if (typeof command === 'string') {
      redacted[SemanticResourceAttributes.PROCESS_COMMAND] = redactArg(command)
    }

    return new Resource(redacted)
  }
}

export const processDetectorSync = new ProcessDetectorSync()
