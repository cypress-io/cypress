import _ from 'lodash'
import debugModule from 'debug'
import { removeDefaultPort } from '@packages/network-tools'
import type { Readable } from 'stream'
import type { IncomingMessage } from 'http'

const debug = debugModule('cypress:proxy:http:util:buffers')
// for logs emitted on every request while a buffer is held
const debugVerbose = debugModule('cypress-verbose:proxy:http:util:buffers')

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
    if (this.buffer) {
      debug('resetting buffers; discarding buffer %o', _.pick(this.buffer, 'url'))
    } else {
      debug('resetting buffers')
    }

    delete this.buffer
  }

  set (obj) {
    obj = _.cloneDeep(obj)
    obj.url = stripPort(obj.url)
    obj.originalUrl = stripPort(obj.originalUrl)

    if (this.buffer) {
      debug('warning: overwriting existing buffer...', { buffer: _.pick(this.buffer, 'url') })
    }

    debug('setting buffer %o', _.pick(obj, 'url'))

    this.buffer = obj
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

      debug('found request buffer %o', { buffer: _.pick(foundBuffer, 'url') })

      return foundBuffer
    }

    if (this.buffer) {
      debugVerbose('requested url %o did not match buffered url %o; buffer not taken', stripPort(str), this.buffer.url)
    }
  }
}
