import _ from 'lodash'

import {
  StaticResponse,
  BackendStaticResponse,
  FixtureOpts,
  GenericStaticResponse,
} from '@packages/net-stubbing/lib/types'

const STATIC_RESPONSE_KEYS: (keyof GenericStaticResponse<void, void>)[] = ['body', 'fixture', 'statusCode', 'headers', 'forceNetworkError']

export function validateStaticResponse (staticResponse: StaticResponse): void {
  const { body, fixture, statusCode, headers, forceNetworkError } = staticResponse

  if (forceNetworkError && (body || statusCode || headers)) {
    throw new Error('`forceNetworkError`, if passed, must be the only option in the StaticResponse.')
  }

  if (body && fixture) {
    throw new Error('`body` and `fixture` cannot both be set, pick one.')
  }

  if (fixture && !_.isString(fixture)) {
    throw new Error('`fixture` must be a string containing a path and, optionally, an encoding separated by a comma (for example, "foo.txt,ascii").')
  }

  // statusCode must be a three-digit integer
  // @see https://tools.ietf.org/html/rfc2616#section-6.1.1
  if (statusCode && !(_.isNumber(statusCode) && _.inRange(statusCode, 100, 999))) {
    throw new Error('`statusCode` must be a number between 100 and 999 (inclusive).')
  }

  if (headers && _.keys(_.omitBy(headers, _.isString)).length) {
    throw new Error('`headers` must be a map of strings to strings.')
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

  return { filePath, encoding }
}

export function getBackendStaticResponse (staticResponse: Readonly<StaticResponse>): BackendStaticResponse {
  const backendStaticResponse: BackendStaticResponse = _.omit(staticResponse, 'body', 'fixture')

  if (staticResponse.fixture) {
    backendStaticResponse.fixture = getFixtureOpts(staticResponse.fixture)
  }

  if (staticResponse.body) {
    if (_.isString(staticResponse.body)) {
      backendStaticResponse.body = staticResponse.body
    } else {
      backendStaticResponse.body = JSON.stringify(staticResponse.body)
      _.set(backendStaticResponse, 'headers.content-type', 'application/json')
    }
  }

  return backendStaticResponse
}

export function hasStaticResponseKeys (obj: any) {
  return _.intersection(_.keys(obj), STATIC_RESPONSE_KEYS).length || _.isEmpty(obj)
}
