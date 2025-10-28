import crossFetch from 'cross-fetch'
import { SystemError } from './system_error'
import { HttpError } from './http_error'
import { ParseError } from './parse_error'
import { strictAgent } from '@packages/network'
import Debug from 'debug'

const debug = Debug('cypress-verbose:server:cloud:api:put')

type FetchInit = Omit<RequestInit, 'agent'>

type MethodlessFetchInit = Omit<FetchInit, 'method'>

export const ParseKinds = Object.freeze({
  JSON: 'json',
  TEXT: 'text',
})

type ParseKind = typeof ParseKinds[keyof typeof ParseKinds]

type FetchOptions = FetchInit & {
  parse?: ParseKind
}

type MethodlessFetchOptions = MethodlessFetchInit & {
  parse: ParseKind
}

export function putFetch<
  TReturn,
> (input: RequestInfo | URL, options: MethodlessFetchOptions): Promise<TReturn> {
  return fetch(input, {
    ...options,
    method: 'PUT',
  })
}

export function postFetch<
  TReturn,
> (input: RequestInfo | URL, options: MethodlessFetchOptions): Promise<TReturn> {
  return fetch(input, {
    ...options,
    method: 'POST',
  })
}

export async function fetch<
  TReturn,
> (input: RequestInfo | URL, options: FetchOptions): Promise<TReturn> {
  const {
    parse,
    method,
    ...init
  } = options

  debug('Initiating %s %s', method, input)
  try {
    const response = await crossFetch(input, {
      ...(init || {}),
      method,
      // cross-fetch thinks this is in the browser, so declares
      // types based on that rather than on node-fetch which it
      // actually uses under the hood. node-fetch supports `agent`.
      // @ts-expect-error
      agent: strictAgent,
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
    const err = options.signal?.aborted ? options.signal.reason : e

    debug('Error (sys error? %s) %o', err.errno || err.code, err)
    if (ParseError.isParseError(err) || HttpError.isHttpError(err)) {
      throw err
    }

    // if the error has a syscall, it's a system error
    if (err.errno || err.code) {
      const url = typeof input === 'string' ? input :
        input instanceof URL ? input.href :
          input instanceof Request ? input.url : 'UNKNOWN_URL'
      const sysError = new SystemError(err, url, err.code, err.errno)

      sysError.stack = err.stack
      throw sysError
    }

    throw err
  }
}
