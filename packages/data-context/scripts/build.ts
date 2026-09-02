import fs from 'fs-extra'
import path from 'path'
import { buildSchema } from 'graphql'
import { writeUrqlIntrospection } from './urqlIntrospection'

const dataContextRoot = path.join(__dirname, '..')

async function generateDataContextSchema () {
  const schemaContents = await fs.promises.readFile(path.join(dataContextRoot, 'schemas/schema.graphql'), 'utf8')

  await writeUrqlIntrospection(buildSchema(schemaContents, { assumeValid: true }))
}

generateDataContextSchema()
