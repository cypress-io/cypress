import pDefer from 'p-defer'
import type { Operation } from '@apollo/client'
import { print } from 'graphql'

export const ipcInFlight = new Map<string, pDefer.DeferredPromise<any>>()

interface GraphQLResponseShape {
  id: string
  result: any
}

export function initGraphQLIPC () {
  window.ipc.on('graphql:response', (event, obj: GraphQLResponseShape) => {
    const dfd = ipcInFlight.get(obj.id)

    if (!dfd) {
      throw new Error('Missing ipcInFlight')
    }

    if (obj.result.errors) {
      // console.log(obj.result)
    }

    dfd.resolve(obj.result)
  })
}

// Relay passes a "params" object with the query name and text. So we define
// a helper function to call our fetchGraphQL utility with params.text
export const fetchGraphql = async function fetchGraphql (
  op: Operation,
) {
  const dfd = pDefer()
  const ipcId = Math.random().toString()

  dfd.promise.finally(() => {
    ipcInFlight.delete(ipcId)
  })

  ipcInFlight.set(ipcId, dfd)

  window.ipc.send('graphql', {
    id: ipcId,
    params: {
      text: print(op.query),
      name: op.operationName,
    },
    variables: op.variables,
  })

  return dfd.promise
}

declare global {
	interface Window{
		ipc: {
			on: (event: string, handler: (event: string, obj: GraphQLResponseShape) => void) => void
			send: (event: string, ...args: any[]) => any
    }
	}
}
