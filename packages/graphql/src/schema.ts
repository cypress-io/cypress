import path from 'path'
import { makeSchema, connectionPlugin } from 'nexus'

import * as schemaTypes from './schemaTypes/'
import { nodePlugin } from './plugins/nexusNodePlugin'
import { remoteSchemaWrapped } from './stitching/remoteSchemaWrapped'
import { NexusLiveMutationPlugin } from './plugins/nexusLiveMutation'
import { nexusErrorWrap } from './plugins/nexusErrorWrap'

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
    schema: remoteSchemaWrapped,
    skipFields: {
      Mutation: ['test'],
    },
  },
  sourceTypes: {
    modules: [
      {
        alias: 'm',
        module: '@packages/data-context/src/data/coreDataShape',
        typeMatch: (type) => new RegExp(`(?:interface|type|class|enum)\\s+(${type.name}Shape)\\W`, 'g'),
      },
    ],
  },
  plugins: [
    nexusErrorWrap,
    connectionPlugin({
      includeNodesField: true,
      nonNullDefaults: {
        output: true,
      },
    }),
    nodePlugin,
    NexusLiveMutationPlugin,
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
