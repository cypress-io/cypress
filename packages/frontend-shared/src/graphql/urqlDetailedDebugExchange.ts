import md5 from 'md5'
import type { Exchange } from '@urql/core'
import { pipe, tap } from 'wonka'
import jsonStableStringify from 'json-stable-stringify'
import type { OperationDefinitionNode } from 'graphql'
import { print } from 'graphql'

declare global {
  interface Window {
    __toPrintClear: Function
    __toPrint__: {
      queries: Record<any, any>
      logs: any[]
      data: Record<string, any>
    }
  }
}

window.__toPrintClear = function () {
  window.__toPrint__ = {
    queries: [],
    logs: [],
    data: {},
  }
}

/**
 * detailedDebugExchange:
 *
 * This is not imported/included by default in the urqlClient, but can be very helpful when debugging
 * edge-case bugs in the urqlCache exchange. To use, import & add in the exchanges array, prior to the
 * makeCacheExchange() definition. Calling `copy(window.__toPrint__)` in the console will spit out a whole
 * bunch of metadata logged about the URQL request/response handling. The `window.__toPrintClear` can be used
 * to reset the state, if you need to narrow down the logs to a smaller scope of payloads.
 */
export const detailedDebugExchange: Exchange = ({ forward }) => {
  return (ops$) => {
    window.__toPrint__ ??= {
      queries: [],
      logs: [],
      data: {},
    }

    return pipe(
      ops$,
      tap((op) => {
        // @ts-ignore
        window.__toPrint__.queries[(op.query.definitions[0] as OperationDefinitionNode).name?.value] = print(op.query)
        window.__toPrint__.logs.push(JSON.parse(JSON.stringify({
          debugType: 'incoming',
          timestamp: new Date().valueOf(),
          ...op,
          query: (op.query.definitions[0] as OperationDefinitionNode).name?.value,
        })))
      }),
      forward,
      tap((result) => {
        const hash = md5(jsonStableStringify(result.data))

        window.__toPrint__.data[hash] = result.data
        window.__toPrint__.logs.push(JSON.parse(JSON.stringify({
          debugType: 'completed',
          timestamp: new Date().valueOf(),
          ...result,
          data: hash,
          operation: {
            ...result.operation,
            query: (result.operation.query.definitions[0] as OperationDefinitionNode).name?.value,
          },
        })))
      }),
    )
  }
}
