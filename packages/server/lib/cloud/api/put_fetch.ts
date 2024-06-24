import crossFetch from 'cross-fetch'
import { NetworkError } from './network_error'
import { HttpError } from './http_error'
import { ParseError } from './parse_error'

export async function putFetch <TReturn extends any = unknown> (input: RequestInfo | URL, init?: RequestInit & { parseJSON: boolean }): Promise<TReturn> {
  try {
    const { parseJSON, ...initParam } = init ?? {}
    const response = await crossFetch(input, {
      ...initParam,
      method: 'PUT',
    })

    if (response.status >= 400) {
      const err = await HttpError.fromResponse(response)

      throw err
    }

    try {
      const body = await (parseJSON ? response.json() : response.text())

      return body as TReturn
    } catch (e) {
      const parseError = new ParseError(e, e.message)

      parseError.stack = e.stack
      throw parseError
    }
  } catch (e) {
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
