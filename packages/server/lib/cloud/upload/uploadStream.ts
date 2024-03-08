import crossFetch from 'cross-fetch'
import fetchCreator from 'fetch-retry-ts'
import fs from 'fs'
import { Readable } from 'stream'
import type { StreamActivityMonitor } from './StreamActivityMonitor'
import Debug from 'debug'
const debug = Debug('cypress:server:cloud:uploadStream')

export class HttpError extends Error {
  constructor (
    public readonly status: number,
    public readonly statusText: string,
    public readonly url: string,
  ) {
    super(`${status}: ${statusText}`)
  }
}

export const uploadStream = async (filePath: string, fileSize: number, destinationUrl: string, timeoutMonitor?: StreamActivityMonitor): Promise<void> => {
  // In order to .pipeThrough the activity montior from the file stream to the fetch body,
  // the original file ReadStream must be converted to a ReadableStream, which is WHATWG spec.
  // Since ReadStream's data type isn't typed, .toWeb defaults to 'any', which causes issues
  // with node-fetch's `body` type definition. coercing this to ReadableStream<ArrayBufferView>
  // seems to work just fine.
  const readableFileStream = Readable.toWeb(fs.createReadStream(filePath)) as ReadableStream<ArrayBufferView>
  const abortController = timeoutMonitor?.getController()

  const fetch = fetchCreator(crossFetch, {
    retries: 2,
    retryDelay: (count) => count * 500,
    // system network errors, and:
    // * 408 Request Timeout
    // * 429 Too Many Requests (S3 can return this)
    // * 502 Bad Gateway
    // * 503 Service Unavailable
    // * 504 Gateway Timeout
    // Other http status codes are not valid for automatic retries.
    retryOn: [408, 429, 502, 503, 504],
  })

  return new Promise(async (resolve, reject) => {
    debug(`${destinationUrl}: PUT ${fileSize}`)

    readableFileStream

    try {
      const response = await fetch(destinationUrl, {
        method: 'PUT',
        headers: {
          'content-length': String(fileSize),
        },
        body: timeoutMonitor ? timeoutMonitor.monitor(readableFileStream) : readableFileStream,
        ...(abortController && { signal: abortController.signal }),
      })

      debug(`${destinationUrl}: HTTP ${response.status}: ${response.statusText}`)

      if (response.status >= 400) {
        reject(new HttpError(response.status, response.statusText, destinationUrl))
      } else {
        // S3 does not include a response body - if the request succeeds,
        // a simple 200 response is returned
        resolve()
      }
    } catch (e) {
      if (abortController && abortController.signal.aborted) {
        reject(abortController.signal.reason)
      } else {
        reject(e)
      }
    }
  })
}
