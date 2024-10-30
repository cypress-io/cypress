import _ from 'lodash'

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

export const STATIC_RESPONSE_WITH_OPTIONS_KEYS: (keyof StaticResponseWithOptions)[] = [...STATIC_RESPONSE_KEYS, 'log']

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

  if (fixture && !_.isString(fixture)) {
    err('`fixture` must be a string containing a path and, optionally, an encoding separated by a comma (for example, "foo.txt,ascii").')
  }

  // statusCode must be a three-digit integer
  // @see https://tools.ietf.org/html/rfc2616#section-6.1.1
  if (statusCode && !(_.isNumber(statusCode) && _.inRange(statusCode, 100, 1000))) {
    err('`statusCode` must be a number between 100 and 999 (inclusive).')
  }

  if (headers && _.keys(_.omitBy(headers, _.isString)).length) {
    err('`headers` must be a map of strings to strings.')
  }

  if (!_.isUndefined(throttleKbps) && (!_.isNumber(throttleKbps) || (throttleKbps < 0 || !_.isFinite(throttleKbps)))) {
    err('`throttleKbps` must be a finite, positive number.')
  }

  if (delay && (!_.isFinite(delay) || delay < 0)) {
    err('`delay` must be a finite, positive number.')
  }
}

export function parseStaticResponseShorthand (statusCodeOrBody: number | string | any, bodyOrHeaders: string | { [key: string]: string }, maybeHeaders?: { [key: string]: string }) {
  if (_.isNumber(statusCodeOrBody)) {
    // statusCodeOrBody is a status code
    const staticResponse: StaticResponse = {
      statusCode: statusCodeOrBody,
    }

    if (!_.isUndefined(bodyOrHeaders)) {
      staticResponse.body = bodyOrHeaders as string
    }

    if (_.isObject(maybeHeaders)) {
      staticResponse.headers = maybeHeaders as { [key: string]: string }
    }

    return staticResponse
  }

  if ((_.isString(statusCodeOrBody) || !hasStaticResponseKeys(statusCodeOrBody)) && !maybeHeaders) {
    const staticResponse: StaticResponse = {
      body: statusCodeOrBody,
    }

    if (_.isObject(bodyOrHeaders)) {
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
  const backendStaticResponse: BackendStaticResponseWithArrayBuffer = _.omit(staticResponse, 'body', 'fixture', 'log')

  if (staticResponse.fixture) {
    backendStaticResponse.fixture = getFixtureOpts(staticResponse.fixture)
  }

  if (!_.isUndefined(staticResponse.body)) {
    if (_.isString(staticResponse.body) || _.isArrayBuffer(staticResponse.body)) {
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
        _.set(backendStaticResponse, 'headers.content-type', 'application/json')
      }
    }
  }

  if (!_.isUndefined(staticResponse.log)) {
    backendStaticResponse.log = !!staticResponse.log
  }

  return backendStaticResponse
}

export function hasStaticResponseKeys (obj: any) {
  return !_.isArray(obj) && (_.intersection(_.keys(obj), STATIC_RESPONSE_KEYS).length || _.isEmpty(obj))
}

export function hasStaticResponseWithOptionsKeys (obj: any) {
  return !_.isArray(obj) && (_.intersection(_.keys(obj), STATIC_RESPONSE_WITH_OPTIONS_KEYS).length || _.isEmpty(obj))
}
