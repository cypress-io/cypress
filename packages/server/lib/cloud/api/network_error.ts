import { scrubUrl } from './scrub_url'

const NetworkErrorKind = 'NetworkError'

export class NetworkError extends Error {
  public readonly kind = NetworkErrorKind
  public readonly url: string
  constructor (
    public readonly originalError: Error,
    url: string,
  ) {
    super(originalError.message)
    this.url = scrubUrl(url)
  }

  static isNetworkError (error: Error & { url?: string, kind?: string }): error is NetworkError {
    return error?.kind === NetworkErrorKind
  }
}
