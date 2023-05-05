import { ExportResult, ExportResultCode } from '@opentelemetry/core'

import type { ReadableSpan, SpanExporter } from '@opentelemetry/sdk-trace-base'

type HoneycombOptions = {
  tracesApiKey: string
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
    options.tracesApiKey,
    options.serviceName,
    options.team,
    options.environment,
  )
}

class ConsoleTraceLinkExporter implements SpanExporter {
  private _traceUrl = ''
  private _traceIds: string[] = []

  constructor (
    apikey: string,
    serviceName: string,
    team: string,
    environment: string,
  ) {
    this._traceUrl = buildTraceUrl(apikey, serviceName, team, environment)
  }

  export (
    spans: ReadableSpan[],
    resultCallback: (result: ExportResult) => void,
  ): void {
    if (this._traceUrl) {
      spans.forEach((span) => {
        const { traceId } = span.spanContext()

        if (!this._traceIds.includes(traceId)) {
          this._traceIds.push(traceId)

          // eslint-disable-next-line no-console
          console.log(
            `Honeycomb link: ${this._traceUrl}=${span.spanContext().traceId}`,
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
 * @param apikey the Honeycom API key used to retrieve the Honeycomb team and environment
 * @param serviceName the Honeycomb service name (or classic dataset) where data is stored
 * @param team the Honeycomb team
 * @param environment the Honeycomb environment
 * @returns
 */
export function buildTraceUrl (
  apikey: string,
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
