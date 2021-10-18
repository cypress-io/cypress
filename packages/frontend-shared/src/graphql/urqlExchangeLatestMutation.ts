import { pipe, tap } from 'wonka'
import type { Exchange, Operation } from '@urql/core'

// Keep track of the latest mutation that was executed. This operation is going
// to be useful to retry it, when there's an error that was originated from
// the mutation itself. Letting us keep track of the latest operation with all
// the variables used. This way, when the fix of the error is done, the
// mutation can be re-executed, making the client refetch the previous queries
// and displaying the correct information.
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
