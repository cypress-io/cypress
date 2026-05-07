export type BundleKind = 'cy-prompt' | 'studio'

export type BundleErrorStage =
  | 'network'
  | 'signature'
  | 'extract'
  | 'manifest'
  | 'publish'

export class BundleError extends Error {
  public readonly name = 'BundleError'
  public readonly kind: BundleKind
  public readonly stage: BundleErrorStage
  // Mirror the wrapped cause's syscall/HTTP code on the BundleError itself
  // so consumers that read `error.code` (e.g. StudioLifecycleManager's cert
  // detection via isNonRetriableCertErrorCode) keep working when network /
  // pipeline failures get wrapped here.
  public readonly code?: string

  constructor (options: { kind: BundleKind, stage: BundleErrorStage, message: string, cause?: unknown }) {
    super(options.message)
    this.kind = options.kind
    this.stage = options.stage

    if (options.cause !== undefined) {
      (this as Error & { cause?: unknown }).cause = options.cause

      const causeCode = (options.cause as { code?: unknown } | null | undefined)?.code

      if (typeof causeCode === 'string') {
        this.code = causeCode
      }
    }
  }

  static isBundleError (err: unknown): err is BundleError {
    return err instanceof Error && (err as Error).name === 'BundleError'
  }
}
