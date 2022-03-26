import _ from 'lodash'
import type { Socket } from '@packages/socket/lib/browser'
import type { ClientOptions } from '@urql/core'
import type { ExecutionPatchResult, ExecutionResult } from 'graphql'
import pDefer from 'p-defer'

/**
 * Emulates the "Response" which is handled by urql
 * in https://github.com/FormidableLabs/urql/blob/main/packages/core/src/internal/fetchSource.ts
 *
 * conforming to:
 * https://github.com/graphql/graphql-wg/blob/main/rfcs/DeferStream.md
 */
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
      io.emit('graphql:request', uid, fetchOptions.body, (payload: ExecutionResult) => {
        if (!payload.hasNext) {
          resolve(new Response(JSON.stringify(payload), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            },
          }))

          return
        }

        const toResolve: Uint8Array[] = []
        let dfd: pDefer.DeferredPromise<Uint8Array>

        // Emulating https://github.com/FormidableLabs/urql/blob/8e92357c5d1a7db2e28827377bda4e781dcd8e3b/packages/core/src/internal/fetchSource.test.ts#L159
        function toPayload (val: ExecutionPatchResult) {
          const chunk = `\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(val)}\r\n---${val.hasNext ? '' : '--'}`

          return new TextEncoder().encode(chunk)
        }

        let isComplete = false
        let hasInitialized = false

        function onDeferPatchUpdate (val: ExecutionPatchResult) {
          if (!val.hasNext) {
            isComplete = true
            io.off(`graphql:request:${uid}`, onDeferPatchUpdate)
          }

          const payload = toPayload(val)

          if (dfd) {
            dfd.resolve(payload)
          } else {
            toResolve.push(payload)
          }
        }
        io.on(`graphql:request:${uid}`, onDeferPatchUpdate)

        const res = new Response(null, {
          status: 200,
          headers: {
            'Content-Type': 'multipart/mixed;',
          },
        })

        res[Symbol.asyncIterator] = (): AsyncIterator<Uint8Array> => {
          return {
            async next () {
              if (!hasInitialized) {
                hasInitialized = true

                return { done: false, value: new TextEncoder().encode('\r\n---') }
              }

              if (toResolve.length) {
                return { done: false, value: toResolve.shift() as Uint8Array }
              }

              if (isComplete) {
                return { done: true, value: undefined }
              }

              dfd = pDefer<Uint8Array>()

              return { done: false, value: await dfd.promise }
            },
          }
        }

        resolve(res)
      })
    })
  }
}
