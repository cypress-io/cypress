import {
  Environment,
  FetchFunction,
  GraphQLResponse,
  GraphQLSingularResponse,
  Network,
  RecordSource,
  Store,
} from 'relay-runtime'
import pDefer from 'p-defer'

export const ipcInFlight = new Map<string, pDefer.DeferredPromise<any>>()

interface GraphQLResponseShape {
  id: string
  result: GraphQLSingularResponse
}

// @ts-expect-error
ipc.on('graphql:response', (event, obj: GraphQLResponseShape) => {
  const dfd = ipcInFlight.get(obj.id)

  if (!dfd) {
    throw new Error('Missing ipcInFlight')
  }

  if (obj.result.errors) {
    console.log(obj.result)
  }

  dfd.resolve(obj.result)
})

// Relay passes a "params" object with the query name and text. So we define
// a helper function to call our fetchGraphQL utility with params.text
export const fetchRelay: FetchFunction = async function fetchRelay(
  params,
  variables
) {
  const dfd = pDefer<GraphQLResponse>()
  const ipcId = Math.random().toString()

  dfd.promise.finally(() => {
    ipcInFlight.delete(ipcId)
  })

  ipcInFlight.set(ipcId, dfd)

  // @ts-expect-error
  ipc.send('graphql', {
    id: ipcId,
    params,
    variables,
  })

  return dfd.promise
}

// Export a singleton instance of Relay Environment configured with our network function:
export const relayEnvironment = new Environment({
  network: Network.create(fetchRelay),
  store: new Store(new RecordSource()),
})
