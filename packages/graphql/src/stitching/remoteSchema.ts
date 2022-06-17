/**
 * DIY "Schema Stitching"
 *
 * Interleaves the remote GraphQL schema with the locally defined schema
 * to create a single unified schema for fetching from the client.
 */
import fs from 'fs'
import path from 'path'
import { buildSchema } from 'graphql'

const LOCAL_SCHEMA_EXTENSIONS = `
scalar JSON

extend type Mutation {
  """
  Used internally to update the URQL cache in the CloudDataSource
  """
  _cloudCacheInvalidate(args: JSON): Boolean
}
`

// Get the Remote schema we've sync'ed locally
export const remoteSchema = buildSchema(
  // ignoring since this happens on the first tick
  // eslint-disable-next-line no-restricted-syntax
  fs.readFileSync(path.join(__dirname, '../../schemas', 'cloud.graphql'), 'utf-8') + LOCAL_SCHEMA_EXTENSIONS,
  { assumeValid: true },
)
