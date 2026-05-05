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

  constructor (options: { kind: BundleKind, stage: BundleErrorStage, message: string, cause?: unknown }) {
    super(options.message)
    this.kind = options.kind
    this.stage = options.stage

    if (options.cause !== undefined) {
      (this as Error & { cause?: unknown }).cause = options.cause
    }
  }

  static isBundleError (err: unknown): err is BundleError {
    return err instanceof Error && (err as Error).name === 'BundleError'
  }
}
