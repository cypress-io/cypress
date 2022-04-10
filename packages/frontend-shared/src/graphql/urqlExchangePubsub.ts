import { pipe, tap } from 'wonka'
import type { Exchange, Operation, OperationResult } from '@urql/core'
import type { Socket } from '@packages/socket/lib/browser'
import type { DefinitionNode, DocumentNode, OperationDefinitionNode } from 'graphql'

export const pubSubExchange = (io: Socket): Exchange => {
  return ({ client, forward }) => {
    const watchedOperations = new Map<number, Operation>()
    const observedOperations = new Map<number, number>()

    io.on('graphql-refresh', (refreshOnly?: {operation: string, field: string, variables: any}) => {
      watchedOperations.forEach((op) => {
        if (!refreshOnly || refreshOnly.operation === getPrimaryOperation(op.query)?.name?.value) {
          client.reexecuteOperation(
            client.createRequestOperation('query', op, {
              requestPolicy: 'cache-and-network',
              fetchOptions: {
                headers: {
                  'x-cypress-graphql-refetch': refreshOnly
                    ? `${refreshOnly.operation}.${refreshOnly.field}`
                    : 'true',
                },
              },
            }),
          )
        }
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

function getPrimaryOperation (query: DocumentNode): OperationDefinitionNode | undefined {
  return query.definitions.find(isOperationDefinitionNode)
}

function isOperationDefinitionNode (node: DefinitionNode): node is OperationDefinitionNode {
  return node.kind === 'OperationDefinition'
}
