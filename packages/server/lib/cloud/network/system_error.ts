/* Node doesn't expose its own internal system error, so we have to kind of ducktype it */

const SystemErrorKind = 'SystemError'

export class SystemError extends Error {
  public readonly kind = SystemErrorKind
  constructor (
    public readonly originalError: Error,
    public readonly url: string,
    public readonly code: string | number | undefined,
    public readonly errno: string | number | undefined,
  ) {
    super(originalError.message)
  }

  static isSystemError (error: Error & { url?: string, kind?: string }): error is SystemError {
    return error?.kind === SystemErrorKind
  }
}
