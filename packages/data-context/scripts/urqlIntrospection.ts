import fs from 'fs-extra'
import path from 'path'
import type { GraphQLSchema } from 'graphql'
import { introspectionFromSchema } from 'graphql'
import { minifyIntrospectionQuery } from '@urql/introspection'

const URQL_INTROSPECTION_PATH = path.join(__dirname, '..', 'src/gen/urql-introspection.gen.ts')

/**
 * The urql GraphCache only needs type shape and nullability to resolve partial
 * results, so the introspection is minified before it is written. This artifact
 * is bundled into the frontend and baked into the V8 snapshot, where the
 * descriptions and input metadata a full introspection carries would triple it.
 */
export async function writeUrqlIntrospection (schema: GraphQLSchema) {
  await fs.ensureDir(path.dirname(URQL_INTROSPECTION_PATH))

  await fs.promises.writeFile(
    URQL_INTROSPECTION_PATH,
    `/* eslint-disable */\nexport const urqlSchema = ${JSON.stringify(minifyIntrospectionQuery(introspectionFromSchema(schema)), null, 2)} as const`,
  )
}
