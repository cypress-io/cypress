import _ from 'lodash'
import Debug from 'debug'
import mime from 'mime'
import isHtml from 'is-html'
import { IncomingMessage } from 'http'
import {
  RouteMatcherOptionsGeneric,
  STRING_MATCHER_FIELDS,
  DICT_STRING_MATCHER_FIELDS,
  BackendStaticResponse,
} from '../types'
import { Readable, PassThrough } from 'stream'
import type CyServer from '@packages/server'
import { Socket } from 'net'
import type { GetFixtureFn } from './types'
import ThrottleStream from 'throttle'
import type { CypressIncomingRequest } from '@packages/proxy'
import type { InterceptedRequest } from './intercepted-request'
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

export function emit (socket: CyServer.Socket, eventName: string, data: object) {
  if (debug.enabled) {
    debug('sending event to driver %o', { eventName, data: _.chain(data).cloneDeep().omit('res.body').value() })
  }

  socket.toDriver('net:stubbing:event', eventName, data)
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

/**
 * Using an existing response object, send a response shaped by a StaticResponse object.
 * @param backendRequest BackendRequest object.
 * @param staticResponse BackendStaticResponse object.
 */
export async function sendStaticResponse (backendRequest: Pick<InterceptedRequest, 'res' | 'onError' | 'onResponse'>, staticResponse: BackendStaticResponse) {
  const { onError, onResponse } = backendRequest

  if (staticResponse.forceNetworkError) {
    debug('forcing network error')
    const err = new Error('forceNetworkError called')

    return onError(err)
  }

  const statusCode = staticResponse.statusCode || 200
  const headers = staticResponse.headers || {}
  const body = backendRequest.res.body = _.isUndefined(staticResponse.body) ? '' : staticResponse.body

  const incomingRes = _getFakeClientResponse({
    statusCode,
    headers,
    body,
  })

  const bodyStream = await getBodyStream(body, _.pick(staticResponse, 'throttleKbps', 'delay'))

  onResponse!(incomingRes, bodyStream)
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

export function mergeDeletedHeaders (before: CyHttpMessages.BaseMessage, after: CyHttpMessages.BaseMessage) {
  for (const k in before.headers) {
    // a header was deleted from `after` but was present in `before`, delete it in `before` too
    !after.headers[k] && delete before.headers[k]
  }
}

export function mergeWithPreservedBuffers (before: CyHttpMessages.BaseMessage, after: Partial<CyHttpMessages.BaseMessage>) {
  // lodash merge converts Buffer into Array (by design)
  // https://github.com/lodash/lodash/issues/2964
  // @see https://github.com/cypress-io/cypress/issues/15898
  _.mergeWith(before, after, (_a, b) => {
    if (b instanceof Buffer) {
      return b
    }

    return undefined
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
