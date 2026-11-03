import type { GraphQLObjectTypeConfig, GraphQLFieldResolver } from 'graphql'
import { GraphQLObjectType, GraphQLSchema, graphql } from 'graphql'

export const createGraphQL = <TSource = any, TContext = any>(
  query: string,
  fields: GraphQLObjectTypeConfig<TSource, TContext>['fields'],
  cb: GraphQLFieldResolver<TSource, TContext>,
) => {
  const TestType = new GraphQLObjectType<TSource, TContext>({
    name: 'Test',
    fields,
  })

  const Query = new GraphQLObjectType<TSource, TContext>({
    name: 'Query',
    fields: {
      test: {
        type: TestType,
        resolve: cb,
      },
    },
  })

  const schema = new GraphQLSchema({
    query: Query,
  })

  return graphql({
    schema,
    source: query,
  })
}
