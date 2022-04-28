import path from 'path'
import { makeSchema, connectionPlugin } from 'nexus'

import * as schemaTypes from './schemaTypes/'
import { nodePlugin } from './plugins/nexusNodePlugin'
import { mutationErrorPlugin, nexusDebugLogPlugin, nexusSlowGuardPlugin, nexusDeferIfNotLoadedPlugin } from './plugins'
import { cloudSchema } from './cloud/cloudSchema'

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
    schema: cloudSchema,
    skipFields: {
      Mutation: ['test'],
    },
  },
  plugins: [
    nexusSlowGuardPlugin,
    nexusDeferIfNotLoadedPlugin,
    nexusDebugLogPlugin,
    mutationErrorPlugin,
    connectionPlugin({
      nonNullDefaults: {
        output: true,
      },
    }),
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
