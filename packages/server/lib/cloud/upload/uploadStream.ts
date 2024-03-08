import fetch from 'cross-fetch'
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

// specifically for uploading to s3 at this point, no response type templating necessary
// note this takes a ReadableStream (e.g., webstream) - it must be converted from a Node
// Readable via Readable.toWeb(fs.getReadStream('/path/to/file'))
export const uploadStream = (filePath: string, fileSize: number, destinationUrl: string, timeoutMonitor?: StreamActivityMonitor): Promise<void> => {
  const fileStream = fs.createReadStream(filePath)
  const readableFileStream = Readable.toWeb(fileStream) as ReadableStream<ArrayBufferView>
  const abortController = timeoutMonitor?.getController()

  return new Promise(async (resolve, reject) => {
    debug(`${destinationUrl}: PUT ${fileSize}`)
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
