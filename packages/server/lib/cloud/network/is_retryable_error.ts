import { SystemError } from '@packages/errors'
import { HttpError } from '@packages/errors'
import Debug from 'debug'
import { isNonRetriableCertErrorCode } from '@packages/errors'

const debug = Debug('cypress-verbose:server:is-retryable-error')

export const isRetryableError = (error: any) => {
  debug('is retryable error? system error: %s, httperror: %s, status: %d',
    error && SystemError.isSystemError(error as any),
    error && HttpError.isHttpError(error as any),
    (error as HttpError)?.status)

  if (SystemError.isSystemError(error)) {
    if (error.code && isNonRetriableCertErrorCode(error.code)) {
      return false
    }

    return true
  }

  if (HttpError.isHttpError(error)) {
    return [408, 429, 502, 503, 504].includes(error.status)
  }

  return false
}
