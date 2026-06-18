import _ from 'lodash'
import Debug from 'debug'
import mime from 'mime'
import type { IncomingMessage } from 'http'
import type { BackendStaticResponse } from '@packages/network-interception'

export { getAllStringMatcherFields } from '@packages/network-interception'

import { Readable, PassThrough } from 'stream'
import type { GetFixtureFn } from './types'
import ThrottleStream from 'throttle'
import type { CypressIncomingRequest } from '@packages/proxy'
import type { SocketBroadcaster } from '@packages/socket'
import { caseInsensitiveGet, caseInsensitiveHas } from '../util'

import type { CyHttpMessages } from '../external-types'
import { getEncoding } from 'istextorbinary'

const debug = Debug('cypress:net-stubbing:server:util')
const htmlLikeRe = /<.+>[\s\S]+<\/.+>/

const isValidJSON = function (text: unknown) {
  if (_.isObject(text)) {
    return true
  }

  try {
    const o = JSON.parse(text as string)

    return _.isObject(o)
  } catch (error) {
    false
  }

  return false
}

export function parseContentType (response?: string) {
  if (isValidJSON(response)) {
    return mime.getType('json')
  }

  if (response && htmlLikeRe.test(response)) {
    return mime.getType('html')
  }

  return mime.getType('text')
}

export function emit (socket: SocketBroadcaster, eventName: string, data: object) {
  if (debug.enabled) {
    debug('sending event to driver %o', { eventName, data: _.chain(data).cloneDeep().omit('res.body').value() })
  }

  socket.toDriver('net:stubbing:event', eventName, data)
}

export function setDefaultHeaders (req: CypressIncomingRequest, res: IncomingMessage) {
  const setDefaultHeader = (lowercaseHeader: string, defaultValueFn: () => string) => {
    if (!caseInsensitiveHas(res.headers, lowercaseHeader)) {
      res.headers[lowercaseHeader] = defaultValueFn()
    }
  }

  // https://github.com/cypress-io/cypress/issues/15050
  // Check if res.headers has a custom header.
  // If so, set access-control-expose-headers to '*'.
  const hasCustomHeader = Object.keys(res.headers).some((header) => {
    // The list of header items that can be accessed from cors request
    // without access-control-expose-headers
    // @see https://stackoverflow.com/a/37931084/1038927
    return ![
      'cache-control',
      'content-language',
      'content-type',
      'expires',
      'last-modified',
      'pragma',
    ].includes(header.toLowerCase())
  })

  // We should not override the user's access-control-expose-headers setting.
  if (hasCustomHeader && !res.headers['access-control-expose-headers']) {
    setDefaultHeader('access-control-expose-headers', _.constant('*'))
  }

  setDefaultHeader('access-control-allow-origin', () => caseInsensitiveGet(req.headers, 'origin') || '*')
  setDefaultHeader('access-control-allow-credentials', _.constant('true'))
}

export async function setResponseFromFixture (getFixtureFn: GetFixtureFn, staticResponse: BackendStaticResponse) {
  const { fixture } = staticResponse

  if (!fixture) {
    return
  }

  const data = await getFixtureFn(fixture.filePath, { encoding: fixture.encoding })

  const { headers } = staticResponse

  if (!headers || !caseInsensitiveGet(headers, 'content-type')) {
    // attempt to detect mimeType based on extension, fall back to regular cy.fixture inspection otherwise
    const mimeType = mime.getType(fixture.filePath) || parseContentType(data)

    _.set(staticResponse, 'headers.content-type', mimeType)
  }

  function getBody (): string {
    // NOTE: for backwards compatibility with cy.route
    if (data === null) {
      return JSON.stringify('')
    }

    if (!_.isBuffer(data) && !_.isString(data)) {
      // TODO: probably we can use another function in fixtures.js that doesn't require us to remassage the fixture
      return JSON.stringify(data)
    }

    return data
  }

  staticResponse.body = getBody()
}

export async function getBodyStream (body: Buffer | string | Readable | undefined, options: { delay?: number, throttleKbps?: number }): Promise<Readable> {
  const { delay, throttleKbps } = options
  const pt = new PassThrough()

  const sendBody = () => {
    let writable = pt

    if (throttleKbps) {
      // ThrottleStream must be instantiated after any other delays because it uses a `Date.now()`
      // called at construction-time to decide if it's behind on throttling bytes
      writable = new ThrottleStream({ bps: throttleKbps * 1024 })
      writable.pipe(pt)
    }

    if (!_.isUndefined(body)) {
      if ((body as Readable).pipe) {
        return (body as Readable).pipe(writable)
      }

      writable.write(body)
    }

    return writable.end()
  }

  delay ? await wait(sendBody, delay) : sendBody()

  return pt
}

function wait (fn, ms) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(fn())
    }, ms)
  })
}

type BodyEncoding = 'utf8' | 'binary' | null

export function getBodyEncoding (req: CyHttpMessages.IncomingRequest): BodyEncoding {
  if (!req || !req.body) {
    return null
  }

  // a simple heuristic for detecting UTF8 encoded requests
  if (req.headers && req.headers['content-type']) {
    const contentTypeHeader = req.headers['content-type'] as string
    const contentType = contentTypeHeader.toLowerCase()

    if (contentType.includes('charset=utf-8') || contentType.includes('charset="utf-8"')) {
      return 'utf8'
    }
  }

  // with fallback to inspecting the buffer using
  // https://github.com/bevry/istextorbinary
  return getEncoding(req.body)
}
