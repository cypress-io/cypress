import { pipe, tap } from 'wonka'
import type { Exchange, Operation } from '@urql/core'
import type { IpcRendererEvent } from 'electron'

type Handler = (evt: IpcRendererEvent, ...args: any[]) => void

declare global {
  interface Window {
    ipc: {
      on: (evt: string, handler: Handler) => void
      send: (msg: string, ...args: any[]) => void
      // For testing
      trigger?: (evt: string, ...args: any[]) => void
    }
  }
}

if (typeof window.ipc === 'undefined') {
  // const handlers: Record<string, Handler[]> = {}
  window.ipc = {
    on () {},
    send () {},
    trigger (evt, ...args) {
      // if (handlers[evt]) {
      //   for (const handler of handlers[evt]) {
      //     handler(evt, ...args)
      //   }
      // }
    },
  }
}

const ipc = window.ipc

export const pubSubExchange = (): Exchange => {
  return ({ client, forward }) => {
    return (ops$) => {
      if (typeof window === 'undefined') {
        return forward(ops$)
      }

      const watchedOperations = new Map<number, Operation>()
      const observedOperations = new Map<number, number>()

      ipc.on('data-context', (...args) => {
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
