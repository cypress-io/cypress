import { pipe, tap } from 'wonka'
import type { Exchange, Operation } from '@urql/core'

export const latestMutationExchange: Exchange = ({ forward }) => {
  return (ops$) => {
    const processIncomingOperation = (op: Operation) => {
      if (op.kind === 'mutation') {
        window.localStorage.setItem('latestGQLOperation', JSON.stringify(op))
      }
    }

    return forward(pipe(ops$, tap(processIncomingOperation)))
  }
}
