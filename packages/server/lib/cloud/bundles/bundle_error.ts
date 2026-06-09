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
  // Mirrored from the cause so `error.code`/`errno`/`syscall` survive the wrapper.
  public readonly code?: string
  public readonly errno?: number
  public readonly syscall?: string

  constructor (options: { kind: BundleKind, stage: BundleErrorStage, message: string, cause?: unknown }) {
    super(options.message)
    this.kind = options.kind
    this.stage = options.stage

    if (options.cause !== undefined) {
      (this as Error & { cause?: unknown }).cause = options.cause

      const cause = options.cause as { code?: unknown, errno?: unknown, syscall?: unknown } | null | undefined

      if (typeof cause?.code === 'string') {
        this.code = cause.code
      }

      if (typeof cause?.errno === 'number') {
        this.errno = cause.errno
      }

      if (typeof cause?.syscall === 'string') {
        this.syscall = cause.syscall
      }
    }
  }

  static isBundleError (err: unknown): err is BundleError {
    return err instanceof Error && (err as Error).name === 'BundleError'
  }
}
