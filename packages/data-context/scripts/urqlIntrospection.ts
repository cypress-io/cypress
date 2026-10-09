import fs from 'fs-extra'
import path from 'path'
import type { GraphQLSchema } from 'graphql'
import { introspectionFromSchema } from 'graphql'
import { minifyIntrospectionQuery } from '@urql/introspection'

const URQL_INTROSPECTION_PATH = path.join(__dirname, '..', 'src/gen/urql-introspection.gen.ts')

/**
 * The GraphCache resolves partial results from type shape and nullability
 * alone. Minifying drops the descriptions and input metadata it never reads,
 * which more than halves an artifact that ships in the frontend bundle and is
 * baked into the V8 snapshot.
 */
export async function writeUrqlIntrospection (schema: GraphQLSchema) {
  await fs.ensureDir(path.dirname(URQL_INTROSPECTION_PATH))

  await fs.promises.writeFile(
    URQL_INTROSPECTION_PATH,
    `/* eslint-disable */\nexport const urqlSchema = ${JSON.stringify(minifyIntrospectionQuery(introspectionFromSchema(schema)), null, 2)} as const`,
  )
}
