import _ from 'lodash'
import Debug from 'debug'
import isHtml from 'is-html'
import { ServerResponse, IncomingMessage } from 'http'
import {
  RouteMatcherOptionsGeneric,
  STRING_MATCHER_FIELDS,
  DICT_STRING_MATCHER_FIELDS,
  BackendStaticResponse,
} from '../types'
import { Readable, PassThrough } from 'stream'
import CyServer from '@packages/server'
import { Socket } from 'net'
import { GetFixtureFn } from './types'
import ThrottleStream from 'throttle'
import MimeTypes from 'mime-types'

// TODO: move this into net-stubbing once cy.route is removed
import { parseContentType } from '@packages/server/lib/controllers/xhrs'
import { CypressIncomingRequest } from '@packages/proxy'

const debug = Debug('cypress:net-stubbing:server:util')

export function emit (socket: CyServer.Socket, eventName: string, data: object) {
  if (debug.enabled) {
    debug('sending event to driver %o', { eventName, data: _.chain(data).cloneDeep().omit('res.body').value() })
  }

  socket.toDriver('net:event', eventName, data)
}

export function getAllStringMatcherFields (options: RouteMatcherOptionsGeneric<any>) {
  return _.concat(
    _.filter(STRING_MATCHER_FIELDS, _.partial(_.has, options)),
    // add the nested DictStringMatcher values to the list of fields
    _.flatten(
      _.filter(
        DICT_STRING_MATCHER_FIELDS.map((field) => {
          const value = options[field]

          if (value) {
            return _.keys(value).map((key) => {
              return `${field}.${key}`
            })
          }

          return ''
        }),
      ),
    ),
  )
}

/**
 * Generate a "response object" that looks like a real Node HTTP response.
 * Instead of directly manipulating the response by using `res.status`, `res.setHeader`, etc.,
 * generating an IncomingMessage allows us to treat the response the same as any other "real"
 * HTTP response, which means the proxy layer can apply response middleware to it.
 */
function _getFakeClientResponse (opts: {
  statusCode: number
  headers: {
    [k: string]: string
  }
  body: string
}) {
  const clientResponse = new IncomingMessage(new Socket)

  // be nice and infer this content-type for the user
  if (!caseInsensitiveGet(opts.headers || {}, 'content-type') && isHtml(opts.body)) {
    opts.headers['content-type'] = 'text/html'
  }

  _.merge(clientResponse, opts)

  return clientResponse
}

const caseInsensitiveGet = function (obj, lowercaseProperty) {
  for (let key of Object.keys(obj)) {
    if (key.toLowerCase() === lowercaseProperty) {
      return obj[key]
    }
  }
}

const caseInsensitiveHas = function (obj, lowercaseProperty) {
  for (let key of Object.keys(obj)) {
    if (key.toLowerCase() === lowercaseProperty) {
      return true
    }
  }

  return false
}

export function setDefaultHeaders (req: CypressIncomingRequest, res: IncomingMessage) {
  const setDefaultHeader = (lowercaseHeader: string, defaultValueFn: () => string) => {
    if (!caseInsensitiveHas(res.headers, lowercaseHeader)) {
      res.headers[lowercaseHeader] = defaultValueFn()
    }
  }

  setDefaultHeader('access-control-allow-origin', () => caseInsensitiveGet(req.headers, 'origin') || '*')
  setDefaultHeader('access-control-allow-credentials', _.constant('true'))
}

export async function setResponseFromFixture (getFixtureFn: GetFixtureFn, staticResponse: BackendStaticResponse) {
  const { fixture } = staticResponse

  if (!fixture) {
    return
  }

  const data = await getFixtureFn(fixture.filePath, { encoding: fixture.encoding || null })

  const { headers } = staticResponse

  if (!headers || !caseInsensitiveGet(headers, 'content-type')) {
    // attempt to detect mimeType based on extension, fall back to regular cy.fixture inspection otherwise
    const mimeType = MimeTypes.lookup(fixture.filePath) || parseContentType(data)

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

/**
 * Using an existing response object, send a response shaped by a StaticResponse object.
 * @param res Response object.
 * @param staticResponse BackendStaticResponse object.
 * @param onResponse Will be called with the response metadata + body stream
 * @param resStream Optionally, provide a Readable stream to be used as the response body (overrides staticResponse.body)
 */
export function sendStaticResponse (res: ServerResponse, staticResponse: BackendStaticResponse, onResponse: (incomingRes: IncomingMessage, stream: Readable) => void) {
  if (staticResponse.forceNetworkError) {
    res.connection.destroy()
    res.destroy()

    return
  }

  const statusCode = staticResponse.statusCode || 200
  const headers = staticResponse.headers || {}
  const body = staticResponse.body || ''

  const incomingRes = _getFakeClientResponse({
    statusCode,
    headers,
    body,
  })

  const bodyStream = getBodyStream(body, _.pick(staticResponse, 'throttleKbps', 'continueResponseAt'))

  onResponse(incomingRes, bodyStream)
}

export function getBodyStream (body: Buffer | string | Readable | undefined, options: { continueResponseAt?: number, throttleKbps?: number }): Readable {
  const { continueResponseAt, throttleKbps } = options
  const delayMs = continueResponseAt ? _.max([continueResponseAt - Date.now(), 0]) : 0
  const pt = new PassThrough()

  const sendBody = () => {
    let writable = pt

    if (throttleKbps) {
      // ThrottleStream must be instantiated after any other delays because it uses a `Date.now()`
      // called at construction-time to decide if it's behind on throttling bytes
      writable = new ThrottleStream({ bps: throttleKbps * 1024 })
      writable.pipe(pt)
    }

    if (body) {
      if ((body as Readable).pipe) {
        return (body as Readable).pipe(writable)
      }

      writable.write(body)
    }

    return writable.end()
  }

  delayMs ? setTimeout(sendBody, delayMs) : sendBody()

  return pt
}
