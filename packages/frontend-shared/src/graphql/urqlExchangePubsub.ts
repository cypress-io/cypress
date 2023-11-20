import { pipe, tap } from 'wonka'
import type { Exchange, Operation, OperationResult } from '@urql/core'
import type { SocketShape } from '@packages/socket/lib/types'
import type { DefinitionNode, DocumentNode, OperationDefinitionNode } from 'graphql'

export const pubSubExchange = (io: SocketShape): Exchange => {
  return ({ client, forward }) => {
    const watchedOperations = new Map<number, Operation>()
    const observedOperations = new Map<number, number>()
    // Keeps track of the operations we're expecting to re-query,
    // but which haven't resolved yet on their initial request.
    const awaitingMount: Record<string, RefreshOnlyInfo> = {}

    function reexecuteOperation (op: Operation, refetchHeader = 'true') {
      client.reexecuteOperation(
        client.createRequestOperation('query', op, {
          requestPolicy: 'cache-and-network',
          fetchOptions: {
            headers: {
              'x-cypress-graphql-refetch': refetchHeader,
            },
          },
        }),
      )
    }

    interface RefreshOnlyInfo {
      operation: string
      field: string
      variables: any
    }

    // Handles the refresh of the GraphQL operation
    io.on('graphql-refetch', (refreshOnly?: RefreshOnlyInfo) => {
      if (refreshOnly?.operation) {
        const fieldHeader = `${refreshOnly.operation}.${refreshOnly.field}`
        const toRefresh = Array.from(watchedOperations.values()).find((o) => getOperationName(o.query) === refreshOnly.operation)

        if (!toRefresh) {
          awaitingMount[refreshOnly.operation] = refreshOnly
        } else {
          reexecuteOperation(toRefresh, fieldHeader)
        }
      } else {
        watchedOperations.forEach((op) => {
          reexecuteOperation(op)
        })
      }
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
        const name = getOperationName(op.operation.query)

        if (name && awaitingMount[name]) {
          const awaiting = awaitingMount[name]

          delete awaitingMount[name]
          reexecuteOperation(op.operation, `${awaiting.operation}.${awaiting.field}`)
        }
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

function getOperationName (query: DocumentNode): string | undefined {
  return getPrimaryOperation(query)?.name?.value
}

function getPrimaryOperation (query: DocumentNode): OperationDefinitionNode | undefined {
  return query.definitions.find(isOperationDefinitionNode)
}

function isOperationDefinitionNode (node: DefinitionNode): node is OperationDefinitionNode {
  return node.kind === 'OperationDefinition'
}
