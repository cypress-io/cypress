import { makeSchema, asNexusMethod } from 'nexus'
import path from 'path'
import { JSONResolver, DateTimeResolver } from 'graphql-scalars'
import * as entities from './entities'
import * as constants from './constants'

const customScalars = [
  asNexusMethod(JSONResolver, 'json'),
  asNexusMethod(DateTimeResolver, 'dateTime'),
]

// for vite
const dirname = typeof __dirname !== 'undefined' ? __dirname : ''

// for vite
process.cwd ??= () => ''

export const graphqlSchema = makeSchema({
  types: [entities, constants, customScalars],
  shouldGenerateArtifacts: true,
  shouldExitAfterGenerateArtifacts: Boolean(process.env.GRAPHQL_CODEGEN),
  // for vite
  outputs: typeof __dirname !== 'undefined' ? {
    typegen: path.join(dirname, 'gen/nxs.gen.ts'),
    schema: path.join(dirname, '..', '..', 'schema.graphql'),
  } : false,
  contextType: {
    module: path.join(dirname, './context/BaseContext.ts'),
    export: 'BaseContext',
  },
  formatTypegen (content, type) {
    if (type === 'schema') {
      return content
    }

    return `/* eslint-disable */\n${content}`
  },
})
