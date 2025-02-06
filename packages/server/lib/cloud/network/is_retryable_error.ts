import { SystemError } from './system_error'
import { HttpError } from './http_error'
import Debug from 'debug'

const debug = Debug('cypress-verbose:server:is-retryable-error')

export const isRetryableError = (error: unknown) => {
  debug('is retryable error? system error: %s, httperror: %s, status: %d',
    error && SystemError.isSystemError(error as any),
    error && HttpError.isHttpError(error as any),
    (error as HttpError)?.status)

  if (SystemError.isSystemError(error as any)) {
    return true
  }

  if (HttpError.isHttpError(error as any)) {
    return [408, 429, 502, 503, 504].includes((error as HttpError).status)
  }

  return false
}
