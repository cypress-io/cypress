/**
 * DIY "Schema Stitching"
 *
 * Interleaves the remote GraphQL schema with the locally defined schema
 * to create a single unified schema for fetching from the client.
 */
import { buildClientSchema } from 'graphql'
// import { arg, core, queryField } from 'nexus'

// Using the introspection, since Vite doesn't like the fs.readFile
import introspectionResult from '../gen/cloud-introspection.gen.json'

// Get the Remote schema we've sync'ed locally
export const remoteSchema = buildClientSchema(
  // @ts-expect-error
  introspectionResult,
  { assumeValid: true },
)
