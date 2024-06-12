const fs = require('fs-extra')
const { buildSchema, extendSchema, parse, introspectionFromSchema, isObjectType } = require('graphql')
const path = require('path')

const graphQlPackageRoot = path.join(__dirname, '..', '..', 'graphql')
const frontendSharedRoot = path.join(__dirname, '..')

/**
 * Adds two fields to the GraphQL types specific to testing
 *
 * @param schema
 * @returns
 */
function generateTestExtensions (schema) {
  const objects = []
  const typesMap = schema.getTypeMap()

  for (const [typeName, type] of Object.entries(typesMap)) {
    if (!typeName.startsWith('__') && isObjectType(type)) {
      if (isObjectType(type)) {
        objects.push(typeName)
      }
    }
  }

  return `
    union TestUnion = ${objects.join(' | ')}

    extend type Query {
      testFragmentMember: TestUnion!
      testFragmentMemberList(count: Int = 2): [TestUnion!]!
    }
  `
}

async function generateFrontendSchema () {
  const schemaContents = await fs.promises.readFile(path.join(graphQlPackageRoot, 'schemas/schema.graphql'), 'utf8')
  const schema = buildSchema(schemaContents, { assumeValid: true })
  const testExtensions = generateTestExtensions(schema)
  const extendedSchema = extendSchema(schema, parse(testExtensions))

  await fs.ensureDir(path.join(frontendSharedRoot, 'src/generated'))
  await fs.writeFile(path.join(frontendSharedRoot, 'src/generated/schema-for-tests.gen.json'), JSON.stringify(introspectionFromSchema(extendedSchema), null, 2))
}

generateFrontendSchema()
