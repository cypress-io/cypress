import path from 'path'
import { makeSchema, connectionPlugin } from 'nexus'

import * as schemaTypes from './schemaTypes/'
import { remoteSchema } from './stitching/remoteSchema'
import { nodePlugin } from './plugins/nexusNodePlugin'

const isCodegen = Boolean(process.env.CYPRESS_INTERNAL_NEXUS_CODEGEN)

export const graphqlSchema = makeSchema({
  types: schemaTypes,
  shouldGenerateArtifacts: isCodegen,
  shouldExitAfterGenerateArtifacts: isCodegen,
  outputs: {
    typegen: {
      outputPath: path.join(__dirname, 'gen/nxs.gen.ts'),
      declareInputs: true,
    },
    schema: path.join(__dirname, '..', 'schemas', 'schema.graphql'),
  },
  contextType: {
    module: '@packages/data-context',
    export: 'DataContext',
  },
  mergeSchema: {
    schema: remoteSchema,
    skipFields: {
      Mutation: ['test'],
    },
  },
  plugins: [
    connectionPlugin(),
    nodePlugin,
  ],
  formatTypegen (content, type) {
    if (type === 'schema') {
      return content
    }

    // TODO(tim): fix in nexus to prevent the regex
    return `/* eslint-disable */\n${content.replace(/\.js"/g, '"')}`
  },
  features: {
    abstractTypeRuntimeChecks: false,
  },
})
