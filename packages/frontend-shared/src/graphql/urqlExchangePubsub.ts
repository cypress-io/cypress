import { pipe, tap } from 'wonka'
import type { Exchange, Operation } from '@urql/core'
import type { Socket } from '@packages/socket/lib/browser'

export const pubSubExchange = (io: Socket): Exchange => {
  return ({ client, forward }) => {
    return (ops$) => {
      if (typeof window === 'undefined') {
        return forward(ops$)
      }

      const watchedOperations = new Map<number, Operation>()
      const observedOperations = new Map<number, number>()

      io.on('data-context', (...args) => {
        watchedOperations.forEach((op) => {
          client.reexecuteOperation(
            client.createRequestOperation('query', op, {
              requestPolicy: 'cache-and-network',
            }),
          )
        })
      })

      const processIncomingOperation = (op: Operation) => {
        if (op.kind === 'query' && !observedOperations.has(op.key)) {
          observedOperations.set(op.key, 1)
          watchedOperations.set(op.key, op)
        }

        if (op.kind === 'teardown' && observedOperations.has(op.key)) {
          observedOperations.delete(op.key)
          watchedOperations.delete(op.key)
        }
      }

      return forward(pipe(ops$, tap(processIncomingOperation)))
    }
  }
}
