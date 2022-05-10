import debugLib from 'debug'
import { execute, GraphQLResolveInfo, print } from 'graphql'
import type { DataContext } from '..'
import { DocumentNodeBuilder } from '../util/DocumentNodeBuilder'

const debug = debugLib('cypress:data-context:GraphQLDataSource')
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

  pushResult ({ source, info, ctx, result }: PushResultParams) {
    if (info.parentType.name === 'Query') {
      this.#pushFragment({ result, ctx, info })

      return
    }

    // If it's a node, we can query as a Node field and push down the result that way
    if (info.parentType.getInterfaces().some((i) => i.name === 'Node') && result.id) {
      this.#pushFragment({ ctx, info, source, result }, true)

      return
    }
  }

  #pushFragment (params: PushNodeFragmentParams | PushQueryFragmentParams, isNode: boolean = false) {
    const docBuilder = new DocumentNodeBuilder({
      parentType: params.info.parentType,
      fieldNodes: params.info.fieldNodes,
    }, isNode)

    Promise.resolve(execute({
      schema: params.info.schema,
      document: isNode ? docBuilder.queryNode : docBuilder.query,
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
        data,
      }])
    }).catch((e) => {
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
