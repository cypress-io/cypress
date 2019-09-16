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

export class HttpBuffers {
  buffers : HttpBuffer[] = []

  all () : HttpBuffer[] {
    return this.buffers
  }

  keys () : string[] {
    return _.map(this.buffers, 'url')
  }

  reset () : void {
    debug('resetting buffers')

    this.buffers = []
  }

  set (obj : HttpBuffer) {
    return this.buffers.push(_.pick(obj, 'url', 'originalUrl', 'jar', 'stream', 'response', 'details'))
  }

  getByOriginalUrl (str) : Optional<HttpBuffer> {
    return _.find(this.buffers, { originalUrl: str })
  }

  get (str) : Optional<HttpBuffer> {
    const find = (str) => {
      return _.find(this.buffers, { url: str })
    }

    const b = find(str)

    if (b) {
      return b
    }

    let parsed = uri.parse(str)

    // if we're on https and we have a port
    // then attempt to find the buffer by
    // slicing off the port since our buffer
    // was likely stored without a port
    if ((parsed.protocol === 'https:') && parsed.port) {
      parsed = uri.removePort(parsed)

      return find(parsed.format())
    }

    return undefined
  }

  take (str) : Optional<HttpBuffer> {
    const buffer = this.get(str)

    if (buffer) {
      this.buffers = _.without(this.buffers, buffer)

      debug('found request buffer %o', { buffer: _.pick(buffer, 'url', 'originalUrl'), bufferCount: this.buffers.length })
    }

    return buffer
  }
}
