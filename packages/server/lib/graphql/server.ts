import { makeSchema, asNexusMethod } from 'nexus'
import path from 'path'
import express from 'express'
import { graphqlHTTP } from 'express-graphql'
import { JSONResolver, DateTimeResolver } from 'graphql-scalars'
import fs from 'fs'
import * as entities from './entities'
import { AddressInfo } from 'net'
import { DataContext } from './util/DataContext'
import { stitchSchemas } from '@graphql-tools/stitch'
import { makeApiSubschema } from './apiServerSchema'
import { GraphQLSchema, printSchema } from 'graphql'

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

app.use('/graphql', graphqlHTTP(() => {
  return {
    schema: graphqlSchema,
    graphiql: true,
    context: DataContext.forHttp(),
  }
}))

let gatewaySchema: GraphQLSchema
let subschema = makeApiSubschema().then((toAdd) => {
  gatewaySchema = stitchSchemas({
    subschemas: [{ schema: graphqlSchema }, toAdd],
  })

  fs.writeFileSync(path.join(__dirname, 'full-schema.graphql'), printSchema(gatewaySchema))
})

app.use('/gateway', graphqlHTTP(async () => {
  while (!gatewaySchema) {
    await subschema
  }

  return {
    schema: gatewaySchema,
    graphiql: true,
    context: DataContext.forHttp(),
  }
}))

const srv = app.listen(52159, () => {
  // eslint-disable-next-line
  console.log(`Express listening on ${(srv.address() as AddressInfo).port}`)
})
