/**
 * DIY "Schema Stitching"
 *
 * Interleaves the remote GraphQL schema with the locally defined schema
 * to create a single unified schema for fetching from the client.
 */
import { buildClientSchema, GraphQLObjectType } from 'graphql'

// Using the introspection, since Vite doesn't like the fs.readFile
import introspectionResult from '../generated/cloud-introspection.gen.json'

// Get the Remote schema we've sync'ed locally
export const remoteSchema = buildClientSchema(
  // @ts-expect-error
  introspectionResult,
  { assumeValid: true },
)

// Pull out any of the known conflicting types
const { Query, Mutation, DateTime, ...rest } = remoteSchema.getTypeMap()

// Alias Remote "Query" as "CloudQuery"
const CloudQuery = new GraphQLObjectType({
  ...(Query as GraphQLObjectType)?.toConfig(),
  name: 'CloudQuery',
})

export const remoteSchemaTypes = {
  CloudQuery,
  ...rest,
}
