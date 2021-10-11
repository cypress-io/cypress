import { graphqlHTTP } from 'express-graphql'
import { graphqlSchema } from './schema'
import type { DataContext } from '@packages/data-context'
import type express from 'express'

export function addGraphQLHTTP (app: ReturnType<typeof express>, context: DataContext) {
  app.use('/graphql', graphqlHTTP((req) => {
    return {
      schema: graphqlSchema,
      graphiql: true,
      context,
    }
  }))

  return app
}
