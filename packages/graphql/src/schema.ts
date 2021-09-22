import { makeSchema, asNexusMethod, connectionPlugin } from 'nexus'
import path from 'path'
import { JSONResolver, DateTimeResolver } from 'graphql-scalars'

import * as entities from './entities'
import * as constants from './constants'
import * as testingTypes from './testing/testUnionType'
import { remoteSchema } from './stitching/remoteSchema'
import { nodePlugin } from './plugins/nexusNodePlugin'

const customScalars = [
  asNexusMethod(JSONResolver, 'json'),
  asNexusMethod(DateTimeResolver, 'dateTime'),
]

// for vite
const dirname = typeof __dirname !== 'undefined' ? __dirname : ''
const isVite = !dirname

// for vite
process.cwd ??= () => ''

const isCodegen = Boolean(process.env.CYPRESS_INTERNAL_NEXUS_CODEGEN)

const types = [entities, constants, customScalars, isVite ? testingTypes : null]

export const graphqlSchema = makeSchema({
  types,
  shouldGenerateArtifacts: isCodegen,
  shouldExitAfterGenerateArtifacts: isCodegen,
  sourceTypes: isCodegen ? {
    modules: [
      {
        alias: 'cloudGen',
        module: path.join(dirname, 'gen/cloud-source-types.gen.ts'),
      },
    ],
  } : undefined,
  // for vite
  outputs: isCodegen ? {
    typegen: path.join(dirname, 'gen/nxs.gen.ts'),
    schema: path.join(dirname, '..', 'schemas', 'schema.graphql'),
  } : false,
  contextType: {
    module: path.join(dirname, './context/BaseContext.ts'),
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
