import _ from 'lodash'
import type { Socket } from '@packages/socket/lib/browser'
import type { ClientOptions } from '@urql/core'

export const urqlFetchSocketAdapter = (io: Socket): ClientOptions['fetch'] => {
  return (url, fetchOptions = {}) => {
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
