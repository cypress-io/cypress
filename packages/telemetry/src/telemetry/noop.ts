import type { Span, Attributes } from '@opentelemetry/api'
import type { SpanExporter } from '@opentelemetry/sdk-trace-base'
import type { TelemetryApi, startSpanOptions, findActiveSpanOptions, contextObject } from './index'

/**
 * The telemetry Noop class is used when telemetry is disabled.
 * It should mirror all the existing functions in telemetry, but no-op for
 * all operations.
 */
export class TelemetryNoop implements TelemetryApi {
  startSpan (arg: startSpanOptions): Span | undefined {
    return undefined
  }

  getSpan (name: string): Span | undefined {
    return undefined
  }

  findActiveSpan (fn: findActiveSpanOptions): Span | undefined {
    return undefined
  }

  endActiveSpanAndChildren (span?: Span | undefined): void {
    return undefined
  }

  getActiveContextObject (): contextObject {
    return {}
  }

  getResources (): Attributes {
    return {}
  }

  shutdown (): Promise<void> {
    return Promise.resolve()
  }

  getExporter (): SpanExporter | undefined {
    return undefined
  }

  setRootContext (rootContextObject?: contextObject): void {
    return undefined
  }
}
