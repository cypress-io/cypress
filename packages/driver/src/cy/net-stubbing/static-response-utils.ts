import { omit, omitBy, setPath, intersection } from '@packages/utils'

import type {
  StaticResponse,
  StaticResponseWithOptions,
  BackendStaticResponseWithArrayBuffer,
  FixtureOpts,
} from '@packages/net-stubbing/lib/types'
import {
  caseInsensitiveHas,
} from '@packages/net-stubbing/lib/util'
import $errUtils from '../../cypress/error_utils'

// user-facing StaticResponse only
export const STATIC_RESPONSE_KEYS: (keyof StaticResponse)[] = ['body', 'fixture', 'statusCode', 'headers', 'forceNetworkError', 'throttleKbps', 'delay']

const STATIC_RESPONSE_WITH_OPTIONS_KEYS: (keyof StaticResponseWithOptions)[] = [...STATIC_RESPONSE_KEYS, 'log']

export function validateStaticResponse (cmd: string, staticResponse: StaticResponse): void {
  const err = (message) => {
    $errUtils.throwErrByPath('net_stubbing.invalid_static_response', { args: { cmd, message, staticResponse } })
  }

  const { body, fixture, statusCode, headers, forceNetworkError, throttleKbps, delay } = staticResponse

  if (forceNetworkError && (body || statusCode || headers)) {
    err('`forceNetworkError`, if passed, must be the only option in the StaticResponse.')
  }

  if (forceNetworkError && Cypress.isBrowser('webkit')) {
    err('`forceNetworkError` was passed, but it is not currently supported in experimental WebKit.')
  }

  if (body && fixture) {
    err('`body` and `fixture` cannot both be set, pick one.')
  }

  if (fixture && typeof fixture !== 'string') {
    err('`fixture` must be a string containing a path and, optionally, an encoding separated by a comma (for example, "foo.txt,ascii").')
  }

  // statusCode must be a three-digit integer
  // @see https://tools.ietf.org/html/rfc2616#section-6.1.1
  if (statusCode && !(typeof statusCode === 'number' && statusCode >= 100 && statusCode < 1000)) {
    err('`statusCode` must be a number between 100 and 999 (inclusive).')
  }

  if (headers && Object.keys(omitBy(headers, (v) => typeof v === 'string')).length) {
    err('`headers` must be a map of strings to strings.')
  }

  if (throttleKbps !== undefined && (typeof throttleKbps !== 'number' || (throttleKbps < 0 || !Number.isFinite(throttleKbps)))) {
    err('`throttleKbps` must be a finite, positive number.')
  }

  if (delay && (!Number.isFinite(delay) || delay < 0)) {
    err('`delay` must be a finite, positive number.')
  }

  // setTimeout uses a 32-bit signed integer internally, so delays >= 2**31
  // (about 24.8 days) are silently treated as 1ms and effectively ignored.
  const MAX_TIMEOUT = 2147483647 // 2**31 - 1

  if (delay && delay > MAX_TIMEOUT) {
    err(`\`delay\` must be less than ${MAX_TIMEOUT + 1}ms (approximately 24.8 days). Larger values are silently ignored by the timer implementation.`)
  }
}

export function parseStaticResponseShorthand (statusCodeOrBody: number | string | any, bodyOrHeaders: string | { [key: string]: string }, maybeHeaders?: { [key: string]: string }) {
  if (typeof statusCodeOrBody === 'number') {
    // statusCodeOrBody is a status code
    const staticResponse: StaticResponse = {
      statusCode: statusCodeOrBody,
    }

    if (bodyOrHeaders !== undefined) {
      staticResponse.body = bodyOrHeaders as string
    }

    if (maybeHeaders != null && typeof maybeHeaders === 'object') {
      staticResponse.headers = maybeHeaders as { [key: string]: string }
    }

    return staticResponse
  }

  if ((typeof statusCodeOrBody === 'string' || !hasStaticResponseKeys(statusCodeOrBody)) && !maybeHeaders) {
    const staticResponse: StaticResponse = {
      body: statusCodeOrBody,
    }

    if (bodyOrHeaders != null && typeof bodyOrHeaders === 'object') {
      staticResponse.headers = bodyOrHeaders as { [key: string]: string }
    }

    return staticResponse
  }

  return
}

function getFixtureOpts (fixture: string): FixtureOpts {
  const [filePath, encoding] = fixture.split(',')

  return { filePath, encoding: encoding === 'null' ? null : encoding }
}

export function getBackendStaticResponse (staticResponse: Readonly<StaticResponseWithOptions>): BackendStaticResponseWithArrayBuffer {
  const backendStaticResponse: BackendStaticResponseWithArrayBuffer = omit(staticResponse, 'body', 'fixture', 'log') as BackendStaticResponseWithArrayBuffer

  if (staticResponse.fixture) {
    backendStaticResponse.fixture = getFixtureOpts(staticResponse.fixture)
  }

  if (staticResponse.body !== undefined) {
    if (typeof staticResponse.body === 'string' || staticResponse.body instanceof ArrayBuffer) {
      backendStaticResponse.body = staticResponse.body
    } else {
      backendStaticResponse.body = JSON.stringify(staticResponse.body)

      // There are various json-related MIME types. We cannot simply set it as `application/json`.
      // @see https://www.iana.org/assignments/media-types/media-types.xhtml
      if (
        !backendStaticResponse.headers ||
        (backendStaticResponse.headers &&
          !caseInsensitiveHas(backendStaticResponse.headers, 'content-type'))
      ) {
        setPath(backendStaticResponse, 'headers.content-type', 'application/json')
      }
    }
  }

  if (staticResponse.log !== undefined) {
    backendStaticResponse.log = !!staticResponse.log
  }

  return backendStaticResponse
}

function hasStaticResponseKeys (obj: any) {
  return !Array.isArray(obj) && (intersection(Object.keys(obj), STATIC_RESPONSE_KEYS).length || Object.keys(obj).length === 0)
}

export function hasStaticResponseWithOptionsKeys (obj: any) {
  return !Array.isArray(obj) && (intersection(Object.keys(obj), STATIC_RESPONSE_WITH_OPTIONS_KEYS).length || Object.keys(obj).length === 0)
}
