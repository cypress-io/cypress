import type { SubschemaConfig, Transform } from '@graphql-tools/delegate'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { wrapSchema } from '@graphql-tools/wrap'
import { GraphQLObjectType, GraphQLSchema } from 'graphql'
import { remoteSchemaExecutor } from './remoteSchemaExecutor'

export function makeWrappedRemoteSchema (remoteSchemaSdl: string) {
  const remoteSchema = makeExecutableSchema({
    typeDefs: remoteSchemaSdl,
  })
  const wrappedSchema = wrapSchema({
    schema: remoteSchema,
    executor: remoteSchemaExecutor,
    transforms: [
      CustomRemoteTransform,
    ],
  })

  return { remoteSchema, wrappedSchema }
}

// Duplicate `Query` as a "CloudQuery" type for the sub-schema
const CustomRemoteTransform: Transform = {
  transformSchema (originalWrappingSchema: GraphQLSchema, subschemaConfig: SubschemaConfig<any, any, any, NexusGen>, transformedSchema?: GraphQLSchema) {
    const config = (originalWrappingSchema.getType('Query') as GraphQLObjectType).toConfig()
    const wrappingConfig = originalWrappingSchema.toConfig()

    // Create a new schema, aliasing "CloudQuery" to the root "query" type, so we can use that
    return new GraphQLSchema({
      ...wrappingConfig,
      types: [
        ...wrappingConfig.types,
        new GraphQLObjectType({
          ...config,
          name: 'CloudQuery',
        }),
      ],
    })
  },
}
