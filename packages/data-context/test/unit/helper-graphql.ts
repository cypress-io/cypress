import { GraphQLObjectTypeConfig, GraphQLFieldResolver, GraphQLObjectType, GraphQLSchema, graphql } from 'graphql'

export const createGraphQL = <TSource = any, TArgs = any, TContext = any>(
  query: string,
  fields: GraphQLObjectTypeConfig<TSource, TContext>['fields'],
  cb: GraphQLFieldResolver<TSource, TArgs, TContext>,
) => {
  const TestType = new GraphQLObjectType({
    name: 'Test',
    fields,
  })

  const Query = new GraphQLObjectType({
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
