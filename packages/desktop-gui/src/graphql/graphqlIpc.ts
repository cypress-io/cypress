import pDefer from 'p-defer'
import type { Operation } from '@apollo/client'
import { print } from 'graphql'

export const ipcInFlight = new Map<string, pDefer.DeferredPromise<any>>()

interface GraphQLResponseShape {
  id: string
  result: any
}

// @ts-expect-error
ipc.on('graphql:response', (event, obj: GraphQLResponseShape) => {
  const dfd = ipcInFlight.get(obj.id)

  if (!dfd) {
    throw new Error('Missing ipcInFlight')
  }

  if (obj.result.errors) {
    // console.log(obj.result)
  }

  dfd.resolve(obj.result)
})

// Relay passes a "params" object with the query name and text. So we define
// a helper function to call our fetchGraphQL utility with params.text
export const fetchGraphql = async function fetchGraphql (
  op: Operation,
) {
  const dfd = pDefer()
  const ipcId = Math.random().toString()
  const queryText = print(op.query)

  // console.log(ipcId, queryText)

  dfd.promise.catch((e) => {
    // eslint-disable-next-line
    debugger
    throw e
  }).finally(() => {
    ipcInFlight.delete(ipcId)
  })

  ipcInFlight.set(ipcId, dfd)

  // @ts-expect-error
  ipc.send('graphql', {
    id: ipcId,
    params: {
      text: queryText,
      name: op.operationName,
    },
    variables: op.variables,
  })

  return dfd.promise
}
