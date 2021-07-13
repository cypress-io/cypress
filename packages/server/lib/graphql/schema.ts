import { makeSchema, asNexusMethod } from 'nexus'
import path from 'path'
import { JSONResolver, DateTimeResolver } from 'graphql-scalars'
import * as entities from './entities'

const customScalars = [
  asNexusMethod(JSONResolver, 'json'),
  asNexusMethod(DateTimeResolver, 'dateTime'),
]

export const graphqlSchema = makeSchema({
  types: [entities, customScalars],
  shouldGenerateArtifacts: true,
  outputs: {
    typegen: path.join(__dirname, 'gen/nxs.gen.ts'),
    schema: path.join(__dirname, '..', '..', 'schema.graphql'),
  },
  formatTypegen (content, type) {
    if (type === 'schema') {
      return content
    }

    return `/* eslint-disable */\n${content}`
  },
})
