import path from 'path'
import './entities'
import { buildSchemaWithDecorators } from 'nexus-decorators'

export const graphqlSchema = buildSchemaWithDecorators({
  shouldGenerateArtifacts: true,
  outputs: {
    typegen: path.join(__dirname, 'gen/nxs.gen.ts'),
    schema: path.join(__dirname, 'server-schema.graphql'),
  },
  formatTypegen (content, type) {
    if (type === 'schema') {
      return content
    }

    return `/* eslint-disable */\n${content}`
  },
})
