/**
 * "Schema Stitching"
 *
 * Interleaves the remote GraphQL schema with the locally defined schema using graphql-tools,
 * to create a single unified schema for fetching from the client.
 *
 * https://www.graphql-tools.com/docs/schema-stitching/stitch-combining-schemas
 */
import fs from 'fs'
import path from 'path'
import { lexicographicSortSchema, printSchema } from 'graphql'
import { batchDelegateToSchema } from '@graphql-tools/batch-delegate'
import { delegateToSchema } from '@graphql-tools/delegate'
import { stitchSchemas } from '@graphql-tools/stitch'
import gql from 'graphql-tag'

import { graphqlSchema } from '../schema'
import { makeWrappedRemoteSchema } from './wrappedRemoteSchema'

// Get the Remote schema we've sync'ed locally
const REMOTE_SCHEMA = fs.readFileSync(path.join(__dirname, '..', '..', 'schemas', 'cloud.graphql'), 'utf8')

const { wrappedSchema, remoteSchema } = makeWrappedRemoteSchema(REMOTE_SCHEMA)

export const combinedSchema = stitchSchemas({
  subschemas: [graphqlSchema, wrappedSchema],
  typeDefs: gql`
    extend type Project {
      """
      The project associated with the current local project, in the Cypress Cloud.
      Returns null if unauthenticated, or if the user does not have access to the project
      """
      cloudProject: CloudProject
    }

    extend type Query {
      """
      Delegates to the Cypress Cloud remote schema. Returns null if unauthenticated
      """
      cloud: CloudQuery
    }
  `,
  resolvers: {
    Project: {
      cloudProject: {
        selectionSet: `{ id }`,
        resolve (project, args, context, info) {
          return batchDelegateToSchema({
            schema: remoteSchema,
            key: project.id,
            context,
            info,
          })
        },
      },
    },
    Query: {
      cloud: {
        resolve (root, args, context, info) {
          return delegateToSchema({
            schema: remoteSchema,
            context,
            info,
          })
        },
      },
    },
  },
})

fs.writeFileSync(path.join(__dirname, '..', '..', 'schemas', 'stitched.graphql'), printSchema(lexicographicSortSchema(combinedSchema)))
