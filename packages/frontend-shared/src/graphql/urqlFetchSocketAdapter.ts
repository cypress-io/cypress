import _ from 'lodash'
import type { SocketShape } from '@packages/socket/lib/types'
import type { ClientOptions } from '@urql/core'

export const urqlFetchSocketAdapter = (io: SocketShape): ClientOptions['fetch'] => {
  return (url, fetchOptions: RequestInit = {}) => {
    return new Promise<Response>((resolve, reject) => {
      // Handle aborted requests
      if (fetchOptions.signal) {
        fetchOptions.signal.onabort = () => {
          reject(new DOMException('Aborted', 'AbortError'))
        }

        if (fetchOptions.signal.aborted) {
          return reject(new DOMException('Aborted', 'AbortError'))
        }
      }

      const uid = _.uniqueId('gql')

      // An ad-hoc version of the "Request"
      io.emit(`graphql:request`, uid, fetchOptions.body, (payload) => {
        resolve(new Response(JSON.stringify(payload), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }))
      })
    })
  }
}
