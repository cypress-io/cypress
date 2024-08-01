import { SystemError } from './system_error'
import { HttpError } from './http_error'
import Debug from 'debug'

const debug = Debug('cypress-verbose:server:is-retryable-error')

export const isRetryableError = (error?: Error) => {
  debug('is retryable error? system error: %s, httperror: %s, status: %d',
    error && SystemError.isSystemError(error),
    error && HttpError.isHttpError(error),
    (error as HttpError)?.status)

  return error ? (
    SystemError.isSystemError(error) ||
    HttpError.isHttpError(error) && [408, 429, 502, 503, 504].includes(error.status)
  ) : false
}
