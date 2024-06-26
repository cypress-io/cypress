const ParseErrorKind = 'ParseErrorKind'

export class ParseError extends Error {
  public readonly kind = ParseErrorKind
  constructor (public readonly originalError: Error, message?: string) {
    super(message)
  }
  static isParseError (err: Error & { kind: string }): err is ParseError {
    return err.kind === ParseErrorKind
  }
}
