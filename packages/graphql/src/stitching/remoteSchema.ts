/**
 * DIY "Schema Stitching"
 *
 * Interleaves the remote GraphQL schema with the locally defined schema
 * to create a single unified schema for fetching from the client.
 */
import { buildClientSchema, GraphQLObjectType } from 'graphql'
import { core, queryField } from 'nexus'

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

const queryConfig = (Query as GraphQLObjectType)?.toConfig()

const fields = typeof queryConfig.fields === 'function' ? queryConfig.fields : queryConfig.fields

const queryFieldsToAdd: core.NexusExtendTypeDef<'Query'>[] = []

const ALLOWED = ['viewer', 'cloudProject', 'cloudProjectsByIds']

for (const [fieldName, fieldConfig] of Object.entries(fields)) {
  if (ALLOWED.includes(fieldName)) {
    const { wrapping, namedType } = core.unwrapGraphQLDef(fieldConfig.type)

    // Add the query fields that we want to include
    queryFieldsToAdd.push(
      queryField(fieldName, {
        type: core.applyNexusWrapping(namedType.name, wrapping),
        // TODO: Fix these types in Nexus to accept null
        description: fieldConfig.description ?? undefined,
        deprecation: fieldConfig.deprecationReason ?? undefined,
        resolve (root, args, ctx, info) {
          return ctx.delegateToRemoteQuery(info)
        },
      }),
    )
  }
}

export const remoteSchemaTypes = {
  queryFieldsToAdd,
  ...rest,
}
