import { makeSchema, asNexusMethod } from 'nexus'
import path from 'path'
import { JSONResolver, DateTimeResolver } from 'graphql-scalars'
import * as entities from './entities'
import * as constants from './constants'
import * as testingTypes from './testing/testUnionType'

const customScalars = [
  asNexusMethod(JSONResolver, 'json'),
  asNexusMethod(DateTimeResolver, 'dateTime'),
]

// for vite
const dirname = typeof __dirname !== 'undefined' ? __dirname : ''

// for vite
process.cwd ??= () => ''

const isCodegen = Boolean(process.env.GRAPHQL_CODEGEN)

export const graphqlSchema = makeSchema({
  types: [entities, constants, customScalars, dirname ? null : testingTypes],
  shouldGenerateArtifacts: isCodegen,
  shouldExitAfterGenerateArtifacts: Boolean(process.env.GRAPHQL_CODEGEN_EXIT),
  // for vite
  outputs: isCodegen ? {
    typegen: path.join(dirname, 'gen/nxs.gen.ts'),
    schema: path.join(dirname, '..', 'schema.graphql'),
  } : false,
  contextType: {
    module: path.join(dirname, './context/BaseContext.ts'),
    export: 'BaseContext',
  },
  formatTypegen (content, type) {
    if (type === 'schema') {
      return content
    }

    // TODO(tim): fix in nexus to prevent the regex
    return `/* eslint-disable */\n${content.replace(/\.js"/g, '"')}`
  },
})
