import _ from 'lodash'
import debugModule from 'debug'
import { uri } from '@packages/network'
import { Readable } from 'stream'
import { Response } from 'express'

const debug = debugModule('cypress:proxy:http:util:buffers')

export type HttpBuffer = {
  details: object
  jar: any
  originalUrl: string
  response: Response
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
  buffers: HttpBuffer[] = []

  all (): HttpBuffer[] {
    return this.buffers
  }

  keys (): string[] {
    return _.map(this.buffers, 'url')
  }

  reset (): void {
    debug('resetting buffers')

    this.buffers = []
  }

  set (obj: HttpBuffer) {
    obj.url = stripPort(obj.url)
    obj.originalUrl = stripPort(obj.originalUrl)

    debug('setting buffer %o', _.pick(obj, 'url'))

    return this.buffers.push(_.pick(obj, 'url', 'originalUrl', 'jar', 'stream', 'response', 'details'))
  }

  getByOriginalUrl (str): Optional<HttpBuffer> {
    const b = _.find(this.buffers, { originalUrl: stripPort(str) })

    if (b) {
      debug('found request buffer by original url %o', { str, buffer: _.pick(b, 'url', 'originalUrl', 'details'), bufferCount: this.buffers.length })
    }

    return b
  }

  get (str): Optional<HttpBuffer> {
    return _.find(this.buffers, { url: stripPort(str) })
  }

  take (str): Optional<HttpBuffer> {
    const buffer = this.get(str)

    if (buffer) {
      this.buffers = _.without(this.buffers, buffer)

      debug('found request buffer %o', { buffer: _.pick(buffer, 'url', 'originalUrl'), bufferCount: this.buffers.length })
    }

    return buffer
  }
}
