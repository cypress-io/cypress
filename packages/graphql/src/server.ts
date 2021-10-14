//

import { graphqlHTTP, GraphQLParams } from 'express-graphql'
import { graphqlSchema } from './schema'
import type { DataContext } from '@packages/data-context'
import type express from 'express'
import { parse } from 'graphql'

const SHOW_GRAPHIQL = process.env.CYPRESS_INTERNAL_ENV !== 'production'

export function addGraphQLHTTP (app: ReturnType<typeof express>, context: DataContext) {
  app.use('/graphql/:operationName?', graphqlHTTP((req, res, params) => {
    const ctx = SHOW_GRAPHIQL ? maybeProxyContext(params, context) : context

    return {
      schema: graphqlSchema,
      graphiql: SHOW_GRAPHIQL,
      context: ctx,
    }
  }))

  return app
}

/**
 * Adds runtime validations during development to ensure patterns of access are enforced
 * on the DataContext
 */
function maybeProxyContext (params: GraphQLParams | undefined, context: DataContext): DataContext {
  if (params?.query) {
    const parsed = parse(params.query)
    const def = parsed.definitions[0]

    if (def?.kind === 'OperationDefinition') {
      return def.operation === 'query' ? proxyContext(context, def.name?.value ?? '(anonymous)') : context
    }
  }

  return context
}

function proxyContext (ctx: DataContext, operationName: string) {
  return new Proxy(ctx, {
    get (target, p, receiver) {
      if (p === 'actions' || p === 'emitter') {
        throw new Error(
          `Cannot access ctx.${p} within a query, only within mutations / outside of a GraphQL request\n` +
          `Seen in operation: ${operationName}`,
        )
      }

      return Reflect.get(target, p, receiver)
    },
  })
}
