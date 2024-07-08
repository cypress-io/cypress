import crossFetch from 'cross-fetch'
import { NetworkError } from './network_error'
import { HttpError } from './http_error'
import { ParseError } from './parse_error'
import { agent } from '@packages/network'
import Debug from 'debug'

const debug = Debug('cypress-verbose:server:cloud:api:put')

type PutInit = Omit<RequestInit, 'agent' | 'method'>

export const ParseKinds = Object.freeze({
  JSON: 'json',
  TEXT: 'text',
})

type ParseKind = typeof ParseKinds[keyof typeof ParseKinds]

type PutOptions = PutInit & {
  parse?: ParseKind
}

export async function putFetch <
  TReturn extends any
> (input: RequestInfo | URL, options: PutOptions = { parse: 'json' }): Promise<TReturn> {
  const {
    parse,
    ...init
  } = options

  debug('Initiating PUT %s', input)
  try {
    const response = await crossFetch(input, {
      ...(init || {}),
      method: 'PUT',
      // cross-fetch thinks this is in the browser, so declares
      // types based on that rather than on node-fetch which it
      // actually uses under the hood. node-fetch supports `agent`.
      // @ts-expect-error
      agent,
    })

    if (response.status >= 400) {
      const err = await HttpError.fromResponse(response)

      throw err
    }

    try {
      switch (parse) {
        case ParseKinds.JSON:
          return await response.json() as TReturn
        case ParseKinds.TEXT:
          return await response.text() as TReturn
        default:
          return response.body as any
      }
    } catch (e) {
      const parseError = new ParseError(e, e.message)

      parseError.stack = e.stack
      throw parseError
    }
  } catch (e) {
    debug('Error: %O', e)
    if (ParseError.isParseError(e)) {
      throw e
    } else if (HttpError.isHttpError(e)) {
      throw e
    }

    // if the error wasn't a parsing error, it's probably a Network error
    const url = typeof input === 'string' ? input :
      input instanceof URL ? input.href :
        input instanceof Request ? input.url : 'UNKNOWN_URL'

    const networkError = new NetworkError(e, url)

    networkError.stack = e.stack
    throw networkError
  }
}
