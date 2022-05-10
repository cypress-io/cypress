import type { NexusGenAbstractTypeMembers } from '@packages/graphql/src/gen/nxs.gen'
import { execute, FieldNode, GraphQLResolveInfo, visit } from 'graphql'
import type { core } from 'nexus'
import type { DataContext } from '../DataContext'

/**
 * Utilities for resolving the "Node" interface into a concrete type.
 *
 * Helpful when we stitch in the remote schema and need to
 */
export class NodeDataSource {
  constructor (private ctx: DataContext) {}

  resolveNode (nodeId: string, info: GraphQLResolveInfo) {
    const [typeName] = this.#base64Decode(nodeId).split(':') as [NexusGenAbstractTypeMembers['Node'], string]

    if (typeName?.startsWith('Cloud')) {
      return this.#delegateNodeToCloud(nodeId, info)
    }

    switch (typeName) {
      case 'CurrentProject':
        return this.#proxyWithTypeName('CurrentProject', this.ctx.lifecycleManager)
      default:
        throw new Error(`Unable to read node for ${typeName}. Add a handler to NodeDataSource`)
    }
  }

  #proxyWithTypeName <T extends NexusGenAbstractTypeMembers['Node'], O extends core.SourceValue<T>> (typename: T, obj: O) {
    // Ensure that we have __typename provided to handle the
    return new Proxy(obj, {
      get (target, prop, receiver) {
        if (prop === '__typename') {
          return typename
        }

        return Reflect.get(target, prop, receiver)
      },
    })
  }

  /**
   * If we detect that the underlying type for a "node" field is a "Cloud" type,
   * then we want to issue it as a "cloudNode" query
   */
  #delegateNodeToCloud (nodeId: string, info: GraphQLResolveInfo) {
    const filteredNodes = info.fieldNodes.map((node) => {
      return visit(node, {
        Field (node) {
          if (node.name.value === 'node') {
            return { ...node, name: { kind: 'Name', value: 'cloudNode' } } as FieldNode
          }

          return
        },
        InlineFragment: (node) => {
          // Remove any non-cloud types from the node
          if (node.typeCondition && !this.ctx.schemaCloud.getType(node.typeCondition.name.value)) {
            return null
          }

          return
        },
      })
    })

    // Execute the node field against the cloud schema
    return execute({
      schema: this.ctx.schemaCloud,
      contextValue: this.ctx,
      variableValues: info.variableValues,
      document: {
        kind: 'Document',
        definitions: [
          {
            kind: 'OperationDefinition',
            operation: 'query',
            selectionSet: {
              kind: 'SelectionSet',
              selections: filteredNodes,
            },
          },
        ],
      },
    })
  }

  #base64Decode (str: string) {
    return Buffer.from(str, 'base64').toString('utf8')
  }
}
