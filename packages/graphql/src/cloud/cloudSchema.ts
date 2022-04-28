import type { GraphQLSchema } from 'graphql'
import { connectionPlugin, makeSchema } from 'nexus'
import path from 'path'
import fs from 'fs'
import { cloudSchemaRemoteWrapped, CLOUD_SCHEMA_PATH } from './cloudSchemaRemote'
import * as types from './cloudSchemaLocalTypes'

export const CLOUD_SCHEMA_LOCAL_PATH = CLOUD_SCHEMA_PATH.replace('cloud.graphql', 'cloud-local.graphql')

/**
 * Checks if we have anything defined in the localTypes file,
 * if we do then we'll consider there to be "local" cloud schema extensions,
 * which means that we'll be using this schema, rather than the remoteSchemWrapped
 * when combining with the other Nexus schema.
 *
 * @returns If
 */
export const hasLocalCloudSchemaExtensions = Object.keys(types).length > 1

const isCodegen = Boolean(process.env.CYPRESS_INTERNAL_NEXUS_CODEGEN)

/**
 * Makes the local schema, caching locally
 * @returns
 */
let cloudSchema: GraphQLSchema

// If we have local cloud schema extensions, we generate a new nexus schema
// wrapping the
if (hasLocalCloudSchemaExtensions) {
  cloudSchema = makeSchema({
    types,
    shouldGenerateArtifacts: isCodegen,
    mergeSchema: {
      schema: cloudSchemaRemoteWrapped,
      skipFields: {
        Mutation: ['test'],
      },
    },
    // We don't need to output types, since this is a subset of the main generated
    // nexus schema, we only need to output the types there
    outputs: {
      schema: path.join(__dirname, '..', '..', 'schemas', 'cloud-local.graphql'),
    },
    plugins: [
      connectionPlugin(),
    ],
  })
} else {
  if (isCodegen) {
    fs.copyFileSync(CLOUD_SCHEMA_PATH, CLOUD_SCHEMA_LOCAL_PATH)
  }

  cloudSchema = cloudSchemaRemoteWrapped
}

export { cloudSchema }
