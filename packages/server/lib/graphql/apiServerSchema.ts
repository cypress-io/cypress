import { introspectSchema, RenameTypes } from '@graphql-tools/wrap'
import type { AsyncExecutor } from '@graphql-tools/utils'
import type { SubschemaConfig } from '@graphql-tools/delegate'
import { buildSchema, GraphQLSchema, print, printSchema } from 'graphql'
import fs from 'fs'
import path from 'path'
import fetch from 'node-fetch'

const remoteExecutor: AsyncExecutor<any> = async function remoteExecutor ({ document, variables }) {
  const query = print(document)
  const fetchResult = await fetch('http://localhost:1234/tr-graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  })

  return fetchResult.json()
}

Promise.resolve(introspectSchema(remoteExecutor)).then((schema) => {
  // fs.writeFileSync(path.join(__dirname))
})

//

const API_SCHEMA_PATH = path.join(__dirname, 'api-schema.graphql')

export async function makeApiSubschema (): Promise<SubschemaConfig> {
  let schema: GraphQLSchema | undefined

  if (fs.existsSync(API_SCHEMA_PATH)) {
    const fileContents = fs.readFileSync(API_SCHEMA_PATH, 'utf8')

    schema = buildSchema(fileContents)
  }

  try {
    schema = await introspectSchema(remoteExecutor)

    fs.promises.writeFile(API_SCHEMA_PATH, printSchema(schema)).catch((e) => {
      console.error(e.stack)
    })
  } catch (e) {
    if (!schema) {
      throw e
    }
  }

  return {
    schema,
    executor: remoteExecutor,
    transforms: [
      new RenameTypes((name) => `Remote_${name}`),
    ],
  }
}
