/**
 * DIY "Schema Stitching"
 *
 * Interleaves the remote GraphQL schema with the locally defined schema
 * to create a single unified schema for fetching from the client.
 */
import fs from 'fs'
import path from 'path'
import { buildSchema } from 'graphql'

// Get the Remote schema we've sync'ed locally
export const remoteSchema = buildSchema(
  fs.readFileSync(path.join(__dirname, '../../schemas', 'cloud.graphql'), 'utf-8'),
  { assumeValid: true },
)
