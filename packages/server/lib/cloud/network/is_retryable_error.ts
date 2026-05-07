import { SystemError } from './system_error'
import { HttpError } from './http_error'
import Debug from 'debug'
import { isNonRetriableCertErrorCode } from './non_retriable_cert_error_codes'

const debug = Debug('cypress-verbose:server:is-retryable-error')

// Per RFC 9110 §9.2.2, PUT, DELETE, and safe methods (GET, HEAD, OPTIONS, TRACE
// from §9.2.1) are idempotent. TRACE is omitted here because it is not used by
// any cloud API caller and is commonly disabled for security reasons.
// https://www.rfc-editor.org/rfc/rfc9110#section-9.2.2
const IDEMPOTENT_METHODS = new Set(['GET', 'HEAD', 'PUT', 'DELETE', 'OPTIONS'])

const ALWAYS_RETRYABLE_STATUSES = [408, 429, 502, 503, 504]

// Additional statuses that are only safe to retry on idempotent methods —
// a server-side error mid-request could otherwise replay a non-idempotent
// side effect (e.g., a POST that partially applied before failing).
const IDEMPOTENT_RETRYABLE_STATUSES = [500]

export const isRetryableError = (error: any, method?: string) => {
  debug('is retryable error? system error: %s, httperror: %s, status: %d, method: %s',
    error && SystemError.isSystemError(error as any),
    error && HttpError.isHttpError(error as any),
    (error as HttpError)?.status,
    method)

  if (SystemError.isSystemError(error)) {
    if (error.code && isNonRetriableCertErrorCode(error.code)) {
      return false
    }

    return true
  }

  if (HttpError.isHttpError(error)) {
    if (ALWAYS_RETRYABLE_STATUSES.includes(error.status)) {
      return true
    }

    if (method && IDEMPOTENT_METHODS.has(method.toUpperCase()) && IDEMPOTENT_RETRYABLE_STATUSES.includes(error.status)) {
      return true
    }

    return false
  }

  return false
}
