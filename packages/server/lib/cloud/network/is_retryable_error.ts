import { NetworkError } from './network_error'
import { HttpError } from './http_error'

export const isRetryableError = (error?: Error) => {
  return error ? (
    NetworkError.isNetworkError(error) ||
    HttpError.isHttpError(error) && [408, 429, 502, 503, 504].includes(error.status)
  ) : false
}
