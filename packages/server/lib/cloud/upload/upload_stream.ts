import crossFetch from 'cross-fetch'
import fetchCreator from 'fetch-retry-ts'
import type { ReadStream } from 'fs'
import type { StreamActivityMonitor } from './stream_activity_monitor'
import Debug from 'debug'
import { HttpError } from '../api/http_error'
import { NetworkError } from '../api/network_error'
import { agent } from '@packages/network'

const debug = Debug('cypress:server:cloud:uploadStream')
const debugVerbose = Debug('cypress-verbose:server:cloud:uploadStream')
/**
 * These are retryable status codes. Other status codes are not valid for automatic
 * retries: they indicate some issue with the client making the request, or that
 * the server can never fulfill the request. Some of these status codes should only
 * be retried if the request is idempotent, but I think it's fine for S3 for now.
 *   - 408 Request Timeout
 *   - 429 Too Many Requests (S3 can return this)
 *   - 502 Bad Gateway
 *   - 503 Service Unavailable
 *   - 504 Gateway Timeout
 * other http status codes are not valid for automatic retries.
 */
const RETRYABLE_STATUS_CODES = [408, 429, 502, 503, 504]

/**
 * expected to be passed into uploadStream: nock + delay is very difficult to
 * use fake timers for, as the callback to generate a nock response (expectedly)
 * executes before any retry is attempted, and there is no wait to "await" that
 * retry hook to advance fake timers. If a method of using fake timers with nock
 * is known, this can be refactored to simplify the uploadStream signature and
 * bake the geometricRetry logic into the args passed to fetchCreator.
 * without passing in a noop delay in the tests, or some way of advancing sinon's
 * clock, the tests for uploadStream would take too long to execute.
 */
export const geometricRetry = (n) => {
  return (n + 1) * 500
}

const identity = <T>(arg: T) => arg

type UploadStreamOptions = {
  retryDelay?: (count: number) => number
  activityMonitor?: StreamActivityMonitor
}

export const uploadStream = async (fileStream: ReadStream, destinationUrl: string, fileSize: number, options?: UploadStreamOptions): Promise<void> => {
  debug(`Uploading file stream (${fileSize} bytes) to ${destinationUrl}`)
  const retryDelay = options?.retryDelay ?? identity
  const timeoutMonitor = options?.activityMonitor ?? undefined

  /**
   * To support more robust error messages from the server than statusText, we attempt to
   * retrieve response.json(). This is async, so a list of error promises is stored here
   * that must be resolved before throwing an aggregate error. This is necessary because
   * ts-fetch-retry's retryOn fn does not support returning a promise.
   */
  const errorPromises: Promise<Error>[] = []
  const abortController = timeoutMonitor?.getController()

  debug('PUT %s: %d byte file upload initiated', destinationUrl, fileSize)

  const retryableFetch = fetchCreator(crossFetch as typeof crossFetch, {
    retries: 2,
    retryDelay,

    retryOn: (attempt, retries, error, response) => {
      debugVerbose('PUT %s Response: %O', destinationUrl, response)
      debugVerbose('PUT %s Error: %O', destinationUrl, error)
      // Record all HTTP errors encountered
      const isHttpError = response?.status && response?.status >= 400
      const isNetworkError = error && !timeoutMonitor?.getController().signal.reason

      if (isHttpError) {
        errorPromises.push(HttpError.fromResponse(response))
      } else if (isNetworkError) {
        errorPromises.push(Promise.resolve(new NetworkError(error, destinationUrl)))
      }

      const isUnderRetryLimit = attempt < retries
      const isRetryableHttpError = (!!response?.status && RETRYABLE_STATUS_CODES.includes(response.status))

      debug('checking if should retry: %s %O', destinationUrl, {
        attempt,
        retries,
        networkError: error,
        status: response?.status,
        statusText: response?.statusText,
      })

      return (
        isUnderRetryLimit && // retries param is ignored if retryOn is a fn, so have to impl
        (isNetworkError || isRetryableHttpError)
      )
    },
  })

  return new Promise(async (resolve, reject) => {
    debug(`${destinationUrl}: PUT ${fileSize}`)
    try {
      const response = await retryableFetch(destinationUrl, {
        agent,
        method: 'PUT',
        headers: {
          'content-length': String(fileSize),
          'content-type': 'application/x-tar',
          'accept': 'application/json',
        },
        // ts thinks this is a web fetch, which only expects ReadableStreams.
        // But, this is a node fetch, which supports ReadStreams.
        // @ts-expect-error
        body: timeoutMonitor ? timeoutMonitor.monitor(fileStream) : fileStream,
        ...(abortController && { signal: abortController.signal }),
      })

      debug('PUT %s: HTTP %d %s', destinationUrl, response.status, response.statusText)

      if (response.status >= 400) {
        const errors = await Promise.all(errorPromises)

        reject(
          errors.length > 1 ?
            new AggregateError(errors, `${errors.length} errors encountered during upload`) :
            errors[0],
        )
      } else {
        // S3 does not include a response body - if the request succeeds,
        // a simple 200 response is returned
        resolve()
      }
    } catch (e) {
      debug('error on upload:', e)
      const signalError = abortController?.signal.reason

      const errors = await Promise.all(errorPromises)

      debug('errors on upload:')
      errors.forEach((e) => debug(e))
      if (signalError && !errors.includes(signalError)) {
        errors.push(signalError)
      }

      if (errors.length > 1) {
        reject(new AggregateError(errors, `${errors.length} errors encountered during upload`))
      } else {
        reject(errors[0])
      }
    }
  })
}
