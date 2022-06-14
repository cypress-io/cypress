import path from 'path'
import { makeSchema, connectionPlugin } from 'nexus'

import * as schemaTypes from './schemaTypes/'
import { nodePlugin } from './plugins/nexusNodePlugin'
import { remoteSchemaWrapped } from './stitching/remoteSchemaWrapped'
import { mutationErrorPlugin, nexusDebugLogPlugin, nexusSlowGuardPlugin, nexusDeferIfNotLoadedPlugin, nexusDeferResolveGuard } from './plugins'

const isCodegen = Boolean(process.env.CYPRESS_INTERNAL_NEXUS_CODEGEN)
// @ts-ignore TODO: figure this out. Packherd problem
const { default: _, ...types } = schemaTypes

export const graphqlSchema = makeSchema({
  types,
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
  plugins: [
    nexusDeferResolveGuard,
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
