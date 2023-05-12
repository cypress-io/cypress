import { ExportResult, ExportResultCode } from '@opentelemetry/core'

import type { ReadableSpan, SpanExporter } from '@opentelemetry/sdk-trace-base'

type HoneycombOptions = {
  serviceName: string
  team: string
  environment: string
}

/**
 * Builds and returns a {@link SpanExporter} that logs Honeycomb URLs for completed traces
 *
 * @remark This is not for production use.
 * @param options The {@link HoneycombOptions} used to configure the exporter
 * @returns the configured {@link ConsoleTraceLinkExporter} instance
 */
export function configureConsoleTraceLinkExporter (
  options: HoneycombOptions,
): SpanExporter {
  return new ConsoleTraceLinkExporter(
    options.serviceName,
    options.team,
    options.environment,
  )
}

class ConsoleTraceLinkExporter implements SpanExporter {
  private _traceUrl = ''
  private _uniqueTraces: {[id: string]: string} = {}

  constructor (
    serviceName: string,
    team: string,
    environment: string,
  ) {
    this._traceUrl = buildTraceUrl(serviceName, team, environment)
  }

  export (
    spans: ReadableSpan[],
    resultCallback: (result: ExportResult) => void,
  ): void {
    if (this._traceUrl) {
      spans.forEach((span) => {
        const { traceId, spanId } = span.spanContext()

        if (!span.ended) {
          if (!Object.keys(this._uniqueTraces).includes(traceId)) {
            this._uniqueTraces[traceId] = spanId

            // eslint-disable-next-line no-console
            console.log(
            `Trace start: [${span.name}] - ${this._traceUrl}=${span.spanContext().traceId}`,
            )
          }
        } else if (this._uniqueTraces[traceId] === spanId) {
          // eslint-disable-next-line no-console
          console.log(
            `Trace end: [${span.name}] - ${this._traceUrl}=${span.spanContext().traceId}`,
          )
        }
      })
    }

    resultCallback({ code: ExportResultCode.SUCCESS })
  }

  shutdown (): Promise<void> {
    return Promise.resolve()
  }
}

/**
 * Builds and returns a URL that is used to log when a trace is completed in the {@link ConsoleTraceLinkExporter}.
 *
 * @param serviceName the Honeycomb service name (or classic dataset) where data is stored
 * @param team the Honeycomb team
 * @param environment the Honeycomb environment
 * @returns
 */
export function buildTraceUrl (
  serviceName: string,
  team: string,
  environment?: string,
): string {
  let url = `https://ui.honeycomb.io/${team}`

  if (environment) {
    url += `/environments/${environment}`
  }

  url += `/datasets/${serviceName}/trace?trace_id`

  return url
}
