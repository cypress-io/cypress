import type { TestingType } from '@packages/types'
import fs from 'fs-extra'
import path from 'path'
import globby from 'globby'

type ConfigOptions = {
  global: Record<string, unknown>
  e2e: Record<string, unknown>
  component: Record<string, unknown>
}

function getHighlightRegexE2E (defaultFolder: 'e2e'|'integration') {
  return `cypress\/(?<dir>${defaultFolder})\/.*?(?<ext>[._-]?[s|S]pec.|[.])(?=[j|t]s[x]?)`
}

const highlightRegexComponent = `cypress\/(?<dir>component)\/.*?(?<ext>[._-]?[s|S]pec.|[.])(?=[j|t]s[x]?)`

export const regexps = {
  e2e: {
    beforeRegexp: getHighlightRegexE2E('integration'),
    afterRegexp: getHighlightRegexE2E('e2e'),
  },
  component: {
    beforeRegexp: highlightRegexComponent,
    afterRegexp: '(?<ext>.cy.)',
  },
} as const

export interface FilePart {
  text: string
  highlight: boolean
}

export class NonSpecFileError extends Error {
  constructor (message: string) {
    super()
    this.message = message
  }
}

export function formatMigrationFile (file: string, regexp: RegExp): FilePart[] {
  const match = regexp.exec(file)

  if (!match?.groups) {
    throw new NonSpecFileError(`Expected groups in ${file} using ${regexp}. Perhaps this isn't a spec file?`)
  }

  // sometimes `.` gets in here as the <ext> group
  // filter it out
  const higlights = Object.values(match.groups).filter((x) => x.length > 1)
  const delimiters = higlights.join('|')
  const re = new RegExp(`(${delimiters})`)
  const split = file.split(re)

  return split.map<FilePart>((text) => {
    return {
      text,
      highlight: higlights.includes(text),
    }
  })
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

export interface RelativeSpecWithTestingType {
  testingType: TestingType
  relative: string
}

async function findByTestingType (cwd: string, dir: string | null, testingType: TestingType) {
  if (!dir) {
    return []
  }

  return (await globby(`${dir}/**/*`, { onlyFiles: true, cwd }))
  .map((relative) => ({ relative, testingType }))
}

export async function getSpecs (
  projectRoot: string,
  componentDirPath: string | null,
  e2eDirPath: string | null,
): Promise<{
  before: RelativeSpecWithTestingType[]
  after: RelativeSpecWithTestingType[]
}> {
  const [comp, e2e] = await Promise.all([
    findByTestingType(projectRoot, componentDirPath, 'component'),
    findByTestingType(projectRoot, e2eDirPath, 'e2e'),
  ])

  return {
    before: [...comp, ...e2e],
    after: [...comp, ...e2e].map((x) => {
      return {
        testingType: x.testingType,
        relative: renameSpecPath(x.relative),
      }
    }),
  }
}

export async function moveSpecFiles (e2eDirPath: string) {
  const specs = (await getSpecFiles(e2eDirPath)).map((spec) => {
    const specPath = `${e2eDirPath}/${spec}`

    return {
      from: specPath,
      to: renameSpecPath(specPath),
    }
  })

  specs.forEach((spec) => {
    fs.moveSync(spec.from, spec.to)
  })
}

async function getSpecFiles (dirPath: string) {
  const files = await fs.readdir(dirPath)

  return files.filter((file) => {
    const filePath = path.join(dirPath, file)

    return fs.statSync(filePath).isFile()
  })
}

export function renameSpecPath (spec: string) {
  return spec
  .replace('integration', 'e2e')
  .replace(/([._-]?[s|S]pec.|[.])(?=[j|t]s[x]?)/, '.cy.')
}
