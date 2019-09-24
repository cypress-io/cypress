import _ from 'lodash'
import debugModule from 'debug'
import { uri } from '@packages/network'
import { Readable } from 'stream'
import { IncomingMessage } from 'http'

const debug = debugModule('cypress:proxy:http:util:buffers')

export type HttpBuffer = {
  details: object
  originalUrl: string
  response: IncomingMessage
  stream: Readable
  url: string
}

const stripPort = (url) => {
  try {
    return uri.removeDefaultPort(url).format()
  } catch (e) {
    return url
  }
}

export class HttpBuffers {
  buffer: Optional<HttpBuffer> = undefined

  reset (): void {
    debug('resetting buffers')

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
  }
}
