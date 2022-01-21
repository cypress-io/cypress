import fs from 'fs-extra'
import path from 'path'

type ConfigOptions = {
  global: Record<string, unknown>
  e2e: Record<string, unknown>
  component: Record<string, unknown>
}

export async function createConfigString (cfg: Partial<Cypress.ConfigOptions>) {
  return createCypressConfigJs(reduceConfig(cfg), getPluginRelativePath(cfg))
}

function getPluginRelativePath (cfg: Partial<Cypress.ConfigOptions>) {
  const DEFAULT_PLUGIN_PATH = path.normalize('/cypress/plugins/index.js')

  return cfg.pluginsFile ? cfg.pluginsFile : DEFAULT_PLUGIN_PATH
}

function reduceConfig (cfg: Partial<Cypress.ConfigOptions>) {
  const excludedFields = ['pluginsFile', '$schema', 'componentFolder']

  return Object.entries(cfg).reduce((acc, [key, val]) => {
    if (excludedFields.includes(key)) {
      return acc
    }

    if (key === 'e2e' || key === 'component') {
      const value = val as Record<string, unknown>

      return { ...acc, [key]: { ...acc[key], ...value } }
    }

    if (key === 'testFiles') {
      return {
        ...acc,
        e2e: { ...acc.e2e, specPattern: val },
        component: { ...acc.component, specPattern: val },
      }
    }

    if (key === 'baseUrl') {
      return {
        ...acc,
        e2e: { ...acc.e2e, [key]: val },
      }
    }

    return { ...acc, global: { ...acc.global, [key]: val } }
  }, { global: {}, e2e: {}, component: {} })
}

function createCypressConfigJs (config: ConfigOptions, pluginPath: string) {
  const globalString = Object.keys(config.global).length > 0 ? `${formatObjectForConfig(config.global, 2)},` : ''
  const componentString = Object.keys(config.component).length > 0 ? createTestingTypeTemplate('component', pluginPath, config.component) : ''
  const e2eString = Object.keys(config.e2e).length > 0 ? createTestingTypeTemplate('e2e', pluginPath, config.e2e) : ''

  return `const { defineConfig } = require('cypress')

module.export = defineConfig({
  ${globalString}${e2eString}${componentString}
})`
}

function formatObjectForConfig (obj: Record<string, unknown>, spaces: number) {
  return JSON.stringify(obj, null, spaces)
  .replace(/"([^"]+)":/g, '$1:') // remove quotes from fields
  .replace(/^[{]|[}]$/g, '') // remove opening and closing {}
  .replace(/"/g, '\'') // single quotes
  .trim()
}

function createTestingTypeTemplate (testingType: 'e2e' | 'component', pluginPath: string, options: Record<string, unknown>) {
  return `
  ${testingType}: {
    setupNodeEvents(on, config) {
      return require('${pluginPath}')
    },
    ${formatObjectForConfig(options, 4)}
  },`
}

export async function getSpecs (componentDirPath: string, e2eDirPath: string) {
  const componentSpecs = await getFiles(componentDirPath)
  const e2eSpecs = await getFiles(e2eDirPath)
  const specs = [...componentSpecs, ...e2eSpecs]

  return {
    before: specs,
    after: renameSpecPath(specs),
  }
}

async function getFiles (dirPath: string) {
  const files = await fs.readdir(dirPath)

  return files.filter((file) => {
    const filePath = path.join(dirPath, file)

    return fs.statSync(filePath).isFile()
  })
}

function renameSpecPath (specs: string[]) {
  return specs.map((spec) => {
    return spec.replace(/([._-]?[s|S]pec.|[.])(?=[j|t]s[x]?)/, '.cy.')
  })
}
