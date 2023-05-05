import { Context, TraceFlags } from '@opentelemetry/api'
import {
  globalErrorHandler, internal, BindOnceFuture, ExportResult, ExportResultCode,
} from '@opentelemetry/core'

import type { Resource } from '@opentelemetry/resources'
import type { Span, SpanProcessor, ReadableSpan, SpanExporter } from '@opentelemetry/sdk-trace-base'

/**
 * An implementation of the {@link SpanProcessor} that converts the {@link Span}
 * to {@link ReadableSpan} and passes it to the configured exporter.
 *
 * Only spans that are sampled are converted.
 */
export class OnStartSpanProcessor implements SpanProcessor {
  private _shutdownOnce: BindOnceFuture<void>;
  private _unresolvedExports: Set<Promise<void>>;

  constructor (private readonly _exporter: SpanExporter) {
    this._shutdownOnce = new BindOnceFuture(this._shutdown, this)
    this._unresolvedExports = new Set<Promise<void>>()
  }

  async forceFlush (): Promise<void> {
    // await unresolved resources before resolving
    await Promise.all(Array.from(this._unresolvedExports))
  }

  onStart (span: Span, _parentContext: Context): void {
    if (this._shutdownOnce.isCalled) {
      return
    }

    if ((span.spanContext().traceFlags & TraceFlags.SAMPLED) === 0) {
      return
    }

    const doExport = () => {
      return internal
      ._export(this._exporter, [span])
      .then((result: ExportResult) => {
        if (result.code !== ExportResultCode.SUCCESS) {
          globalErrorHandler(
            result.error ??
                new Error(
                  `SimpleSpanProcessor: span export failed (status ${result})`,
                ),
          )
        }
      })
      .catch((error) => {
        globalErrorHandler(error)
      })
    }

    // Avoid scheduling a promise to make the behavior more predictable and easier to test
    if (span.resource.asyncAttributesPending) {
      const exportPromise = (span.resource as Resource)
      .waitForAsyncAttributes?.()
      .then(
        () => {
          if (exportPromise != null) {
            this._unresolvedExports.delete(exportPromise)
          }

          return doExport()
        },
        (err) => globalErrorHandler(err),
      )

      // store the unresolved exports
      if (exportPromise != null) {
        this._unresolvedExports.add(exportPromise)
      }
    } else {
      void doExport()
    }
  }

  onEnd (span: ReadableSpan): void { }

  shutdown (): Promise<void> {
    return this._shutdownOnce.call()
  }

  private _shutdown (): Promise<void> {
    return this._exporter.shutdown()
  }
}
