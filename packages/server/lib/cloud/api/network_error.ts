import { scrubUrl } from './scrub_url'

const NetworkErrorKind = 'NetworkError'

export class NetworkError extends Error {
  public readonly kind = NetworkErrorKind
  constructor (
    public readonly originalError: Error,
    public readonly url: string,
  ) {
    super(`${scrubUrl(url)}: ${originalError.message}`)
  }

  static isNetworkError (error: Error & { url?: string, kind?: string }): error is NetworkError {
    return error?.kind === NetworkErrorKind
  }
}
