const fs = require('fs-extra')
const path = require('path')

const { projectConfigOptions, testingTypeConfigOptions, testingTypeBreakingOptions } = require('../lib/options')

const schemaTemplate = {
  title: 'JSON schema for the https://cypress.io Test Runner\'s configuration file. Details at https://on.cypress.io/configuration',
  $schema: 'http://json-schema.org/draft-04/schema#',
  type: 'object',
  definitions: {
    cypressConfig: {
      properties: {},
      'additionalProperties': false,
    },
  },
  allOf: [
    {
      $ref: '#/definitions/cypressConfig',
    }, {
      properties: {},
    },
  ],
}

const determineVal = (type) => {
  if (Array.isArray(type?.value)) {
    return { enum: type.value }
  }

  if (typeof type?.value === 'object') {
    return { type, items: type.value }
  }

  return { type: type?.name || type }
}

const handleType = (type) => {
  if (Array.isArray(type)) {
    return { type: type.map((opt) => opt?.name || opt) }
  }

  return determineVal(type)
}

const generateRootConfigDefinition = () => {
  const rootProperties = {}

  projectConfigOptions.forEach((option) => {
    let { name, defaultValue, description, type } = option

    if (name === 'nodeVersion') {
      defaultValue = 'system'
    }

    rootProperties[`${name}`] = {
      default: defaultValue,
      description,
      ...handleType(type),
    }
  })

  return rootProperties
}

const generateTestingTypeConfigSchema = (testingType: 'component' | 'e2e') => {
  const definition = {
    description: `${testingType} testing specific configuration`,
    $ref: '#/definitions/cypressConfig',
    properties: {},
  }

  testingTypeConfigOptions.forEach((option) => {
    let { name, defaultValue, description, type } = option

    if (!testingTypeBreakingOptions[`${testingType}`].some((invalidConfigOption) => invalidConfigOption.name === name)) {
      definition.properties[`${name}`] = {
        default: typeof defaultValue === 'function' ? defaultValue({ testingType }) : defaultValue,
        description,
        ...handleType(type),
      }
    }
  })

  return definition
}

const generateConfigSchema = () => {
  const testingTypeSchemas = {
    component: generateTestingTypeConfigSchema('component'),
    e2e: generateTestingTypeConfigSchema('e2e'),
  }

  schemaTemplate.definitions.cypressConfig.properties = generateRootConfigDefinition()
  schemaTemplate.allOf[1].properties = testingTypeSchemas

  const schemaFilePath = path.resolve(path.join('..', '..', 'cli', 'schema', 'cy.schema.json'))

  console.log(JSON.stringify(schemaTemplate, null, '  '))
  fs.writeFile(schemaFilePath, JSON.stringify(schemaTemplate, null, '  '), 'utf8', (err) => {
    if (err) {
      // eslint-disable-next-line
      console.error('Error generating the configuration schema')
      throw err
    }
  })
}

generateConfigSchema()
