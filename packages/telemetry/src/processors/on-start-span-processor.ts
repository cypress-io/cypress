import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base'
import type { Span } from '@opentelemetry/sdk-trace-base'
import type { Context } from '@opentelemetry/api'

/**
 * An implementation of the {@link SpanProcessor} that converts the {@link Span}
 * to {@link ReadableSpan} and passes it to the configured exporter.
 *
 * Only spans that are sampled are converted.
 */
export class OnStartSpanProcessor extends SimpleSpanProcessor {
  onStart (span: Span, _parentContext: Context): void {
    return this.onEnd(span)
  }
}
