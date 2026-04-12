import { pick } from '@packages/utils'
import debugModule from 'debug'
import { removeDefaultPort } from '@packages/network-tools'
import type { Readable } from 'stream'
import type { IncomingMessage } from 'http'

const debug = debugModule('cypress:proxy:http:util:buffers')

export type HttpBuffer = {
  details: object
  originalUrl: string
  response: IncomingMessage
  stream: Readable
  url: string
  urlDoesNotMatchPolicyBasedOnDomain: boolean
}

const stripPort = (url) => {
  try {
    return removeDefaultPort(url).format()
  } catch (e) {
    return url
  }
}

export class HttpBuffers {
  buffer: Optional<HttpBuffer> | undefined = undefined

  reset (): void {
    debug('resetting buffers')

    delete this.buffer
  }

  set (obj) {
    const cloned = {
      ...obj,
      url: stripPort(obj.url),
      originalUrl: stripPort(obj.originalUrl),
      details: obj.details ? { ...obj.details } : obj.details,
    }

    if (this.buffer) {
      debug('warning: overwriting existing buffer...', { buffer: pick(this.buffer, 'url') })
    }

    debug('setting buffer %o', pick(cloned, 'url'))

    this.buffer = cloned
  }

  get (str): Optional<HttpBuffer> {
    if (this.buffer && this.buffer.url === stripPort(str)) {
      return this.buffer
    }
  }

  take (str): Optional<HttpBuffer> {
    const foundBuffer = this.get(str)

    if (foundBuffer) {
      delete this.buffer

      debug('found request buffer %o', { buffer: pick(foundBuffer, 'url') })

      return foundBuffer
    }
  }
}
