import { makeSchema, asNexusMethod, connectionPlugin } from 'nexus'
import path from 'path'
import { JSONResolver, DateTimeResolver } from 'graphql-scalars'

import * as entities from './entities'
import * as constants from './constants'
import { remoteSchema } from './stitching/remoteSchema'
import { nodePlugin } from './plugins/nexusNodePlugin'

const customScalars = [
  asNexusMethod(JSONResolver, 'json'),
  asNexusMethod(DateTimeResolver, 'dateTime'),
]

const isCodegen = Boolean(process.env.CYPRESS_INTERNAL_NEXUS_CODEGEN)

export const graphqlSchema = makeSchema({
  types: [entities, constants, customScalars],
  shouldGenerateArtifacts: isCodegen,
  shouldExitAfterGenerateArtifacts: isCodegen,
  // for vite
  outputs: isCodegen ? {
    typegen: path.join(__dirname, 'gen/nxs.gen.ts'),
    schema: path.join(__dirname, '..', 'schemas', 'schema.graphql'),
  } : false,
  contextType: {
    module: path.join(__dirname, './context/BaseContext.ts'),
    export: 'BaseContext',
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
