import { pipe, tap } from 'wonka'
import type { Exchange, Operation } from '@urql/core'

export let lastMutationRetry: () => void | undefined

export const latestMutationExchange: Exchange = ({ client, forward }) => {
  return (ops$) => {
    const processIncomingOperation = (op: Operation) => {
      if (op.kind === 'mutation') {
        lastMutationRetry = () => {
          return client.reexecuteOperation(
            client.createRequestOperation('mutation', op, {
              requestPolicy: 'cache-and-network',
            }),
          )
        }
      }
    }

    return forward(pipe(ops$, tap(processIncomingOperation)))
  }
}
