import { pipe, tap } from 'wonka'
import type { Exchange, Operation, OperationResult } from '@urql/core'
import type { Socket } from '@packages/socket/lib/browser'

export const pubSubExchange = (io: Socket): Exchange => {
  return ({ client, forward }) => {
    const watchedOperations = new Map<number, Operation>()
    const observedOperations = new Map<number, number>()

    io.on('data-context-push', (...args) => {
      watchedOperations.forEach((op) => {
        client.reexecuteOperation(
          client.createRequestOperation('query', op, {
            requestPolicy: 'cache-and-network',
          }),
        )
      })
    })

    const processIncomingOperation = (op: Operation) => {
      if (op.kind === 'teardown' && observedOperations.has(op.key)) {
        observedOperations.delete(op.key)
        watchedOperations.delete(op.key)
      }
    }

    const processResultOperation = (op: OperationResult) => {
      if (op.operation.kind === 'query' && !observedOperations.has(op.operation.key)) {
        observedOperations.set(op.operation.key, 1)
        watchedOperations.set(op.operation.key, op.operation)
      }
    }

    return (ops$) => {
      if (typeof window === 'undefined') {
        return forward(ops$)
      }

      return pipe(forward(pipe(ops$, tap(processIncomingOperation))), tap(processResultOperation))
    }
  }
}
