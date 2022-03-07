const fs = require('fs-extra')
const path = require('path')

const { projectConfigOptions, testingTypeConfigOptions, testingTypeBreakingOptions } = require('../lib/options')

const configInterfaces = {
  root: 'ConfigOptions',
  resolved: 'ResolvedConfigOptions',
  runTime: 'RuntimeConfigOptions',
  component: 'ComponentConfigOptions extends ConfigOptions',
  e2e: 'E2EConfigOptions extends ConfigOptions',
  nodeEvents: 'PluginConfigOptions extends ConfigOptions',
}

const handleType2 = (type) => {
  type = Array.isArray(type) ? type : [type]

  return type.map((opt) => {
    if (opt?.name === 'array') {
      return `Array<${opt.value}>`
    }

    return opt?.name || opt
  }).join(' | ')
}

const generateRootConfigTypes = () => {
  let rootConfigTypes = `interface ${configInterfaces.root} {`

  projectConfigOptions.forEach((option) => {
    let { name, defaultValue, description, type } = option

    if (name === 'component' || name === 'e2e') {
      return
    }

    if (name === 'nodeVersion') {
      defaultValue = 'system'
    }

    rootConfigTypes += `
    /**
     * ${description}
     * @default ${defaultValue}
     */
     ${name}: ${handleType2(type)}
     `
  })

  rootConfigTypes += `
  }`

  return rootConfigTypes
}

const generateTestingTypeConfigTypes = (testingType: 'component' | 'e2e') => {
  const interfaceName = configInterfaces[`${testingType}`]
  let configTypes = `interface ${interfaceName} {`

  testingTypeConfigOptions.forEach((option) => {
    let { name, defaultValue, description, type } = option

    if (testingTypeBreakingOptions[`${testingType}`].some((invalidConfigOption) => invalidConfigOption.name === name)) {
      return
    }

    configTypes += `
    /**
     * ${description}
     * @default ${typeof defaultValue === 'function' ? defaultValue({ testingType }) : defaultValue}
     */
     ${name}: ${handleType2(type)}
     `
  })

  configTypes += `
  }`

  return configTypes
}

const generateConfigTypes = () => {
  const rootConfigOptions = generateRootConfigTypes()

  const componentConfigOptions = generateTestingTypeConfigTypes('component')
  const e2eConfigOptions = generateTestingTypeConfigTypes('e2e')

  const typeDefinitions = `
declare namespace Cypress {
  ${rootConfigOptions}

  ${componentConfigOptions}

  ${e2eConfigOptions}
}
`

  const schemaFilePath = path.resolve(path.join('..', '..', 'cli', 'types', 'cypress-config.d.ts'))

  fs.writeFile(schemaFilePath, typeDefinitions, 'utf8', (err) => {
    if (err) {
      // eslint-disable-next-line
      console.error('Error generating the configuration schema')
      throw err
    }
  })
}

generateConfigTypes()
