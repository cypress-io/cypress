import type { ReadStream } from 'fs'
//import { Transform } from 'stream'

/*
class HttpError extends Error {
  constructor (
    public readonly statusCode: number,
    public readonly status: string,
    public readonly url: string
  ) {
    super(`${statusCode}`)
  }
}
*/

export const uploadStream = <T>(fileStream: ReadStream, destinationUrl: string, opts: {
  startTimeout: number
  stallThreshold: number
}): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    /*
    const abortController = new AbortController()

    const fail = (err) => {
      abortController.abort()
      // clear upload begin, stall timeouts
      reject(err)
    }

    fileStream.on('error', fail)

    const progressMonitor = new Transform({
      transform (chunk, encoding, callback) {
        // reset stall timeout
        // clear start timeout
        callback(null, chunk)
      },
    })
*/
  })
}
