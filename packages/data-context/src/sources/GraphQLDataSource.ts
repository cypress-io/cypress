import type { NexusGenAbstractTypeMembers } from '@packages/graphql/src/gen/nxs.gen'
import debugLib from 'debug'
import { execute, FieldNode, GraphQLResolveInfo, print, visit } from 'graphql'
import type { core } from 'nexus'
import _ from 'lodash'
import type { DataContext } from '..'
import { DocumentNodeBuilder } from '../util/DocumentNodeBuilder'

const debug = debugLib('cypress:data-context:sources:GraphQLDataSource')
const RESOLVED_SOURCE = Symbol('RESOLVED_SOURCE')

export interface PushResultParams {
  info: GraphQLResolveInfo
  ctx: DataContext
  result: any
  source?: any
}

export interface PushQueryFragmentParams {
  source?: any
  result: any
  ctx: DataContext
  info: GraphQLResolveInfo
}

export interface PushNodeFragmentParams extends PushQueryFragmentParams {
  source: any
}

export class GraphQLDataSource {
  readonly RESOLVED_SOURCE = RESOLVED_SOURCE

  resolveNode (nodeId: string, ctx: DataContext, info: GraphQLResolveInfo) {
    const [typeName] = this.#base64Decode(nodeId).split(':') as [NexusGenAbstractTypeMembers['Node'], string]

    if (typeName?.startsWith('Cloud')) {
      return this.#delegateNodeToCloud(nodeId, ctx, info)
    }

    switch (typeName) {
      case 'CurrentProject':
        return this.#proxyWithTypeName('CurrentProject', ctx.lifecycleManager)
      default:
        throw new Error(`Unable to read node for ${typeName}. Add a handler to GraphQLDataSource`)
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
  #delegateNodeToCloud (nodeId: string, ctx: DataContext, info: GraphQLResolveInfo) {
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
          if (node.typeCondition && !ctx.config.schemaCloud.getType(node.typeCondition.name.value)) {
            return null
          }

          return
        },
      })
    })

    // Execute the node field against the cloud schema
    return execute({
      schema: ctx.config.schemaCloud,
      contextValue: ctx,
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

  invalidateClientUrqlCache (ctx: DataContext) {
    ctx.emitter.pushFragment([{
      data: null,
      errors: [],
      target: 'Query',
      fragment: '{}',
      invalidateCache: true,
    }])
  }

  pushResult ({ source, info, ctx, result }: PushResultParams) {
    if (info.parentType.name === 'Query') {
      this.#pushFragment({ result, ctx, info })

      return
    }

    // If it's a node, we can query as a Node field and push down the result that way
    if (info.parentType.getInterfaces().some((i) => i.name === 'Node') && (result.id || ['CloudProjectUnauthorized', 'CloudProjectNotFound'].includes(result.__typename))) {
      this.#pushFragment({ ctx, info, source, result }, true)

      return
    }
  }

  #pushFragment (params: PushNodeFragmentParams | PushQueryFragmentParams, isNode: boolean = false) {
    const docBuilder = new DocumentNodeBuilder({
      isNode,
      parentType: params.info.parentType,
      fieldNodes: params.info.fieldNodes,
      variableDefinitions: params.info.operation.variableDefinitions,
      operationName: params.info.operation.name?.value ?? params.info.fieldNodes.map((n) => n.name.value).sort().join('_'),
    })

    Promise.resolve(execute({
      schema: params.info.schema,
      document: isNode ? docBuilder.queryNode : docBuilder.query,
      variableValues: params.info.variableValues,
      rootValue: this.#makeRootValue(params, isNode, params.source),
      contextValue: params.ctx,
    })).then((result) => {
      debug(`pushFragment value %j`, result)

      const data = isNode ? result.data?.node : result.data

      // Take the result from executing the query, and push it down to the client
      // along with a fragment representing the part of the graph we're updating
      params.ctx.emitter.pushFragment([{
        target: params.info.parentType.name,
        fragment: print(docBuilder.clientWriteFragment),
        variables: _.pick(params.info.variableValues, docBuilder.variableNames),
        data,
        errors: result.errors,
      }])
    }).catch((e) => {
      params.ctx.emitter.pushFragment([{
        target: params.info.parentType.name,
        fragment: print(docBuilder.clientWriteFragment),
        variables: _.pick(params.info.variableValues, docBuilder.variableNames),
        data: null,
        errors: [e],
      }])

      debug(`pushFragment execution error %o`, e)
    })
  }

  #makeRootValue (params: PushQueryFragmentParams, node: boolean, nodeSource?: any): any {
    // If we're resolving a node, we have a field named "node", with the resolved value
    // conforming to the "node" resolver
    if (node) {
      return {
        [RESOLVED_SOURCE]: true,
        node: new Proxy(nodeSource, {
          get (target, p, receiver) {
            if (p === '__typename') {
              return params.info.parentType.name
            }

            return Reflect.get(target, p, receiver)
          },
        }),
      }
    }

    return {
      [RESOLVED_SOURCE]: true,
      [params.info.fieldName]: params.result,
    }
  }
}
