import { makeSchema, asNexusMethod } from 'nexus'
import path from 'path'
import express from 'express'
import { graphqlHTTP } from 'express-graphql'
import { JSONResolver, DateTimeResolver } from 'graphql-scalars'

import * as entities from './entities'
import { AddressInfo } from 'net'

const customScalars = [
  asNexusMethod(JSONResolver, 'json'),
  asNexusMethod(DateTimeResolver, 'dateTime'),
]

export const graphqlSchema = makeSchema({
  types: [entities, customScalars],
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

const app = express()

app.use('/graphql', graphqlHTTP({
  schema: graphqlSchema,
  graphiql: true,
}))

const srv = app.listen(52159, () => {
  // eslint-disable-next-line
  console.log(`Express listening on ${(srv.address() as AddressInfo).port}`)
})
