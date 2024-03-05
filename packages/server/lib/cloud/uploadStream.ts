import type { Readable } from 'stream'
import fetch from 'cross-fetch'

//import { Transform } from 'stream'

export class HttpError extends Error {
  constructor (
    public readonly status: number,
    public readonly statusText: string,
    public readonly url: string,
  ) {
    super(`${status}: ${statusText}`)
  }
}

export const uploadStream = <T>(fileStream: Readable, destinationUrl: string, opts: {
  startTimeout?: number
  stallThreshold?: number
} = {}): Promise<T | string | undefined> => {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await fetch(destinationUrl, {
        method: 'PUT',
        // @ts-expect-error - this is supported
        body: fileStream,
      })

      if (response.status === 404) {
        resolve(undefined)
      } else if (response.status >= 400) {
        reject(new HttpError(response.status, response.statusText, destinationUrl))
      } else {
        if (response.headers.get('Content-Type') === 'application/json') {
          resolve(await response.json())
        } else {
          resolve(await response.text())
        }
      }
    } catch (e) {
      reject(e)
    }
  })
}
