const fs = require('fs-extra')
const { buildSchema, introspectionFromSchema } = require('graphql')
const path = require('path')
const { minifyIntrospectionQuery } = require('@urql/introspection')

const graphQlPackageRoot = path.join(__dirname, '..', '..', 'graphql')
const dataContextRoot = path.join(__dirname, '..')

async function generateDataContextSchema () {
  const schemaContents = await fs.promises.readFile(path.join(graphQlPackageRoot, 'schemas/schema.graphql'), 'utf8')
  const schema = buildSchema(schemaContents, { assumeValid: true })

  const URQL_INTROSPECTION_PATH = path.join(dataContextRoot, 'src/gen/urql-introspection.gen.ts')

  await fs.ensureDir(path.dirname(URQL_INTROSPECTION_PATH))

  await fs.promises.writeFile(
    URQL_INTROSPECTION_PATH,
    `/* eslint-disable */\nexport const urqlSchema = ${JSON.stringify(minifyIntrospectionQuery(introspectionFromSchema(schema)), null, 2)} as const`,
  )
}

generateDataContextSchema()
